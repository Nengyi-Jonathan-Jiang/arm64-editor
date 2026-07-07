use crate::components::BranchPredictor;
use crate::components::lru_cache::{FixedSizeLRUCache, LRUCache};
use crate::components::sizes::Addr;
use crate::params::StaticBranchPredictionMode;
use crate::unsafe_ref::UnsafeMutRef;
use core::ptr::slice_from_raw_parts_mut;
use hybrid_array::ArraySize;
use typenum::{U4, Unsigned, U0, U1, U2};

#[repr(transparent)]
pub struct Predictor0 {
    base: BranchPredictorBase<<Self as UseBranchPredictorBase>::BTBAssociativity>,
}

unsafe impl UseBranchPredictorBase for Predictor0 {
    type BTBAssociativity = U4; // 4 is good enough
    type BHTEntrySizeBits = U0;

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
pub struct Predictor2 {
    base: BranchPredictorBase<<Self as UseBranchPredictorBase>::BTBAssociativity>,
}

unsafe impl UseBranchPredictorBase for Predictor2 {
    type BTBAssociativity = U4; // 4 is good enough
    type BHTEntrySizeBits = U2;

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

struct BTBCacheEntry {
    tag: Addr,
    target: Addr,
}

macro_rules! const_is_nonneg {
    ($x: ty) => {
        [(); <$x>::USIZE]
    };
}

struct BranchPredictorBase<
    // needs to use typenum instead of generic const because this needs to work with
    // UseBranchPredictorBase's associated type BTBAssociativity
    BTBAssociativity: ArraySize,
> {
    static_mode: StaticBranchPredictionMode,
    branch_target_buffer: UnsafeMutRef<[FixedSizeLRUCache<BTBCacheEntry, BTBAssociativity>]>,
    branch_history_table: UnsafeMutRef<[u8]>,
}

/// Provides a new() function that can be used to construct a BranchPredictor
pub trait ConstructBranchPredictor {
    /// Given a function that allocates memory and parameters, allocate and initialize an instance
    /// of self
    ///
    /// Unsafe:
    /// - `get_mem` must return a memory allocation with the given size and alignment in bytes that
    ///   satisfies the lifetime semantics of [`UnsafeMutRef`]
    fn new<F: Fn(usize, usize) -> *mut ()>(
        get_mem: F,
        btb_size_log: u8,
        bht_size_log: u8,
        static_mode: StaticBranchPredictionMode,
    ) -> UnsafeMutRef<dyn BranchPredictor>;
}

/// Unsafe:
/// - Zeroed memory must be a valid value of `EntryData`
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
        let btb = &self.base().branch_target_buffer;
        let BTBIndexer { index, tag } = index_btb(btb.len(), addr);
        let predicted_target_addr = btb[index].get(|x| x.tag == tag)?.target;

        let static_prediction = match self.base().static_mode {
            StaticBranchPredictionMode::Always => true,
            StaticBranchPredictionMode::Never => false,
            // Predict taken if backward
            StaticBranchPredictionMode::Directional => addr > predicted_target_addr,
        };

        if T::BHTEntrySizeBits::USIZE == 0 {
            return if static_prediction { Some(addr) } else { None };
        }

        let bht = &self.base().branch_history_table;
        let BHTIndexer {
            byte_index,
            mask,
            shift,
        } = index_bht::<T::BHTEntrySizeBits>(bht.len(), addr);
        let bht_entry = (bht[byte_index] >> shift) & mask;

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
    let index = (addr & (table_len - 1) as Addr) as usize;
    let tag = addr ^ (index as Addr);

    BTBIndexer { index, tag }
}

fn index_bht<EntrySizeBits: Unsigned>(bht_len: usize, addr: Addr) -> BHTIndexer {
    let index = (addr & (bht_len - 1) as Addr) as usize;

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
    //noinspection RsUnresolvedPath (RustRover has issues with associated consts in generics)
    fn new<F: Fn(usize, usize) -> *mut ()>(
        get_mem: F,
        btb_size_log: u8,
        bht_size_log: u8,
        static_mode: StaticBranchPredictionMode,
    ) -> UnsafeMutRef<dyn BranchPredictor> {
        fn get_mem_for<T>(len: usize, get_mem: &impl Fn(usize, usize) -> *mut ()) -> *mut T {
            get_mem(size_of::<T>() * len, align_of::<T>()) as *mut T
        }

        let btb_len: usize = 1 << btb_size_log;
        let bht_len = (T::BHTEntrySizeBits::USIZE << bht_size_log).div_ceil(8);

        let res_mem = get_mem_for::<T>(1, &get_mem);
        let btb_mem =
            get_mem_for::<FixedSizeLRUCache<BTBCacheEntry, T::BTBAssociativity>>(btb_len, &get_mem);
        let bht_mem = get_mem_for::<u8>(bht_len, &get_mem);

        let btb_slice = slice_from_raw_parts_mut(btb_mem, btb_len);
        let bht_slice = slice_from_raw_parts_mut(bht_mem, bht_len);

        let mut res = unsafe { UnsafeMutRef::new_from_ptr(res_mem) };

        let base = res.base_mut();
        base.static_mode = static_mode;
        unsafe {
            base.branch_target_buffer = UnsafeMutRef::new_from_ptr(btb_slice);
            base.branch_history_table = UnsafeMutRef::new_from_ptr(bht_slice);
        }

        unsafe { res.transmute_into::<T>().map_into(|x| x as _) }
    }
}
