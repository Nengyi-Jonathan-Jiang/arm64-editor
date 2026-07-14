use crate::alloc_interface::{IAlloc, IAllocation};
use crate::components::BranchPredictor;
use crate::components::lru_cache::{FixedSizeLRUCache, LRUCache};
use crate::components::sizes::{Addr, INSTRUCTION_SIZE_BYTES, Instruction};
use crate::params::StaticBranchPredictionMode;
use crate::{Alloc, Allocation};
use hybrid_array::ArraySize;
use typenum::{U0, U1, U2, U4, Unsigned};

#[repr(transparent)]
pub struct Predictor0 {
    base: BranchPredictorBase<<Self as UseBranchPredictorBase>::BTBAssociativity>,
}

unsafe impl UseBranchPredictorBase for Predictor0 {
    type BTBAssociativity = U4; // 4 is good enough
    type BHTEntrySizeBits = U0;
    const INITIAL_BYTE: u8 = 0; // Irrelevant, 0 is fine

    fn dynamic_predict(_: u8, static_prediction: bool) -> bool {
        static_prediction
    }

    fn dynamic_update(_: u8, _: bool) -> u8 {
        0
    }

    fn base(&self) -> &BranchPredictorBase<Self::BTBAssociativity> {
        &self.base
    }

    fn base_mut(&mut self) -> &mut BranchPredictorBase<Self::BTBAssociativity> {
        &mut self.base
    }
}

#[repr(transparent)]
pub struct Predictor1 {
    base: BranchPredictorBase<<Self as UseBranchPredictorBase>::BTBAssociativity>,
}

unsafe impl UseBranchPredictorBase for Predictor1 {
    type BTBAssociativity = U4; // 4 is good enough
    type BHTEntrySizeBits = U1;
    const INITIAL_BYTE: u8 = 1; // 1 = predict taken

    fn dynamic_predict(state: u8, _: bool) -> bool {
        state != 0
    }

    fn dynamic_update(_: u8, did_jump: bool) -> u8 {
        did_jump as u8
    }

    fn base(&self) -> &BranchPredictorBase<Self::BTBAssociativity> {
        &self.base
    }

    fn base_mut(&mut self) -> &mut BranchPredictorBase<Self::BTBAssociativity> {
        &mut self.base
    }
}

#[repr(transparent)]
pub struct Predictor2 {
    base: BranchPredictorBase<<Self as UseBranchPredictorBase>::BTBAssociativity>,
}

unsafe impl UseBranchPredictorBase for Predictor2 {
    type BTBAssociativity = U4; // 4 is good enough
    type BHTEntrySizeBits = U2;
    const INITIAL_BYTE: u8 = 2; // 2 = slightly predict taken

    fn dynamic_predict(state: u8, _: bool) -> bool {
        (state & 2) != 0
    }

    fn dynamic_update(mut state: u8, did_jump: bool) -> u8 {
        // new_state = state + {1 if did_jump else -1} = state + 2 * did_jump - 1
        state = state + 2 * (did_jump as u8); // so this is new_state + 1

        if state == 0 {
            0 // new_state + 1 == 0 so new_state == -1, clamp to 0
        } else if state == 5 {
            3 // new_state + 1 == 5 so new_state == 4, clamp to 3
        } else {
            state - 1 // return new_state
        }
    }

    fn base(&self) -> &BranchPredictorBase<Self::BTBAssociativity> {
        &self.base
    }

    fn base_mut(&mut self) -> &mut BranchPredictorBase<Self::BTBAssociativity> {
        &mut self.base
    }
}

/// NOT ZeroInit
struct BTBCacheEntry {
    tag: Addr,
    target: Addr,
}

impl Default for BTBCacheEntry {
    fn default() -> Self {
        Self {
            // 0b1000...000 is definitely not a valid address; to get there we would need to have
            // used more than 9 exabytes of memory from either end of the address space
            tag: (Addr::MAX >> 1) + 1,
            // If we do end up there somehow, do horrible things
            target: 1,
        }
    }
}

struct BranchPredictorBase<
    // needs to use typenum instead of generic const because this needs to work with
    // UseBranchPredictorBase's associated type BTBAssociativity
    BTBAssociativity: ArraySize,
> {
    static_mode: StaticBranchPredictionMode,
    branch_target_buffer: Allocation<[FixedSizeLRUCache<BTBCacheEntry, BTBAssociativity>]>,
    branch_history_table: Allocation<[u8]>,
}

/// Provides a new() function that can be used to construct a BranchPredictor
pub trait ConstructBranchPredictor {
    /// Given a function that allocates memory and parameters, allocate and initialize an instance
    /// of self
    ///
    /// Unsafe:
    /// - `get_mem` must return a memory allocation with the given size and alignment in bytes that
    ///   satisfies the lifetime semantics of [`UnsafeMutRef`]
    fn new(
        btb_size_log: u8,
        bht_size_log: u8,
        static_mode: StaticBranchPredictionMode,
    ) -> Allocation<dyn BranchPredictor>;
}

/// Unsafe:
/// - The only non-zero-sized field in Self must be a BranchPredictorBase<EntryData>
unsafe trait UseBranchPredictorBase
where
    Self: Sized + BranchPredictor + 'static,
{
    /// Associativity of cache used in the branch target buffer
    type BTBAssociativity: ArraySize;
    /// Size of a BHT entry, in bits. This must divide 8 (so that there is an integer number of
    /// entries per byte)
    type BHTEntrySizeBits: ArraySize;

    /// Initial byte value used to bht memory
    const INITIAL_BYTE: u8;

    /// Given the bht state, predict whether the branch will be taken
    fn dynamic_predict(state: u8, static_prediction: bool) -> bool;
    /// Update the bht state with the given information (whether the branch was taken)
    fn dynamic_update(state: u8, did_jump: bool) -> u8;

    /// Get self as BranchPredictorBase
    fn base(&self) -> &BranchPredictorBase<Self::BTBAssociativity>;

    /// Get self as mut BranchPredictorBase
    fn base_mut(&mut self) -> &mut BranchPredictorBase<Self::BTBAssociativity>;
}

impl<T: UseBranchPredictorBase> BranchPredictor for T {
    fn predict(&self, addr: Addr) -> Option<Addr> {
        let predicted_target_addr = {
            let btb = &self.base().branch_target_buffer;
            let BTBIndexer { index, tag } = index_btb(btb.len(), addr);

            btb[index].get(|x| x.tag == tag)?.target
        };

        let static_prediction = match self.base().static_mode {
            StaticBranchPredictionMode::Always => true,
            StaticBranchPredictionMode::Never => false,
            // Predict taken if backward
            StaticBranchPredictionMode::Directional => addr > predicted_target_addr,
        };

        let bht_entry = if T::BHTEntrySizeBits::USIZE != 0 {
            let bht = &self.base().branch_history_table;
            let BHTIndexer {
                byte_index,
                mask,
                shift,
            } = index_bht::<T::BHTEntrySizeBits>(bht.len(), addr);

            (bht[byte_index] >> shift) & mask
        } else {
            0
        };

        if T::dynamic_predict(bht_entry, static_prediction) {
            Some(predicted_target_addr)
        } else {
            None
        }
    }

    fn update_target(&mut self, addr: Addr, target_addr: Addr) {
        let btb = &mut self.base_mut().branch_target_buffer;
        let BTBIndexer { index, tag } = index_btb(btb.len(), addr);

        btb[index].get_or_insert(
            |x| x.tag == tag,
            |entry| {
                entry.tag = tag;
                entry.target = target_addr;
            },
        );
    }

    fn update_branch(&mut self, addr: Addr, did_jump: bool) {
        if T::BHTEntrySizeBits::USIZE == 0 {
            return;
        }

        let bht = &mut self.base_mut().branch_history_table;
        let BHTIndexer {
            byte_index,
            mask,
            shift,
        } = index_bht::<T::BHTEntrySizeBits>(bht.len(), addr);

        let bht_entry = (bht[byte_index] >> shift) & mask;
        let new_entry = Self::dynamic_update(bht_entry, did_jump);
        bht[byte_index] &= !(mask << shift);
        bht[byte_index] |= new_entry << shift;
    }
}

struct BTBIndexer {
    index: usize,
    tag: Addr,
}
struct BHTIndexer {
    byte_index: usize,
    shift: usize,
    mask: u8,
}

fn index_btb(table_len: usize, addr: Addr) -> BTBIndexer {
    let addr = addr as usize / INSTRUCTION_SIZE_BYTES;
    let index = addr & (table_len - 1);
    let tag = (addr ^ index) as Addr;

    BTBIndexer { index, tag }
}

fn index_bht<EntrySizeBits: Unsigned>(bht_len: usize, addr: Addr) -> BHTIndexer {
    let index = (addr as usize / INSTRUCTION_SIZE_BYTES) & (bht_len - 1);

    let entries_per_byte = 8 / EntrySizeBits::USIZE;

    let byte_index = index / entries_per_byte;
    let mask = (1u8 << EntrySizeBits::USIZE) - 1;
    let shift = EntrySizeBits::USIZE * (index % entries_per_byte);

    BHTIndexer {
        byte_index,
        mask,
        shift,
    }
}

impl<T: UseBranchPredictorBase> ConstructBranchPredictor for T {
    fn new(
        btb_size_log: u8,
        bht_size_log: u8,
        static_mode: StaticBranchPredictionMode,
    ) -> Allocation<dyn BranchPredictor> {
        let btb_len = 1 << btb_size_log;
        let bht_len = (T::BHTEntrySizeBits::USIZE << bht_size_log).div_ceil(8);

        let branch_target_buffer =
            Alloc::alloc_slice::<FixedSizeLRUCache<BTBCacheEntry, T::BTBAssociativity>>(btb_len)
                .init_slice_with(|_| Default::default());
        let branch_history_table =
            Alloc::alloc_slice::<u8>(bht_len).map_slice(|_, _| T::INITIAL_BYTE);

        let res = Alloc::alloc::<BranchPredictorBase<T::BTBAssociativity>>().map(|_| {
            BranchPredictorBase {
                static_mode,
                branch_target_buffer,
                branch_history_table,
            }
        });

        unsafe {
            res.transmute::<T>()
                .unsized_map(|x: &mut T| x as &mut dyn BranchPredictor)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_static_predictor() {
        let mut predictor = Predictor0::new(4, 6, StaticBranchPredictionMode::Always);
        let p: &mut dyn BranchPredictor = &mut *predictor;

        // No entries should exist
        assert_eq!(p.predict(0), None);
        assert_eq!(p.predict(4), None);
        assert_eq!(p.predict(12), None);
        assert_eq!(p.predict(20), None);
        assert_eq!(p.predict(264), None);
        // The trap entry
        assert_eq!(p.predict(0x8000_0000_0000_0000), Some(1));
    }
}
