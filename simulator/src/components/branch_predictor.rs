use core::ptr::slice_from_raw_parts_mut;

use crate::components::sizes::Addr;
use crate::components::BranchPredictor;
use crate::params::StaticBranchPredictionMode;
use crate::transmute_assertions::TransmuteAssertions;
use crate::unsafe_ref::UnsafeMutRef;

#[repr(transparent)]
pub struct Predictor0 {
    base: BranchPredictorBase<()>,
}

unsafe impl UseBranchPredictorBase for Predictor0 {
    type EntryData = ();

    fn simple_update(_: &mut Self::EntryData, _: bool) {}

    fn simple_predict(_: &Self::EntryData, _: Addr, _: Addr, static_prediction: bool) -> bool {
        static_prediction
    }

    fn base(&self) -> &BranchPredictorBase<Self::EntryData> {
        &self.base
    }

    fn base_mut(&mut self) -> &mut BranchPredictorBase<Self::EntryData> {
        &mut self.base
    }
}

#[repr(transparent)]
pub struct Predictor1 {
    base: BranchPredictorBase<bool>,
}

unsafe impl UseBranchPredictorBase for Predictor1 {
    type EntryData = bool;

    fn simple_update(_entry: &mut Self::EntryData, _did_jump: bool) {
        todo!()
    }

    fn simple_predict(
        _entry: &Self::EntryData,
        _addr: Addr,
        _target_addr: Addr,
        _static_prediction: bool,
    ) -> bool {
        todo!()
    }

    fn base(&self) -> &BranchPredictorBase<Self::EntryData> {
        &self.base
    }

    fn base_mut(&mut self) -> &mut BranchPredictorBase<Self::EntryData> {
        &mut self.base
    }
}

#[repr(transparent)]
pub struct Predictor2 {
    base: BranchPredictorBase<u8>,
}

unsafe impl UseBranchPredictorBase for Predictor2 {
    type EntryData = u8;

    fn simple_update(_entry: &mut Self::EntryData, _did_jump: bool) {
        todo!()
    }

    fn simple_predict(
        _entry: &Self::EntryData,
        _addr: Addr,
        _target_addr: Addr,
        _static_prediction: bool,
    ) -> bool {
        todo!()
    }

    fn base(&self) -> &BranchPredictorBase<Self::EntryData> {
        &self.base
    }

    fn base_mut(&mut self) -> &mut BranchPredictorBase<Self::EntryData> {
        &mut self.base
    }
}

struct BhtEntry<EntryData> {
    last_indirect_target: Addr,
    data: EntryData,
}

struct BranchPredictorBase<EntryData> {
    static_mode: StaticBranchPredictionMode,
    bht: UnsafeMutRef<[BhtEntry<EntryData>]>,
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
    type EntryData;

    fn simple_update(entry: &mut Self::EntryData, did_jump: bool);

    fn simple_predict(
        entry: &Self::EntryData,
        addr: Addr,
        target_addr: Addr,
        static_prediction: bool,
    ) -> bool;

    fn base(&self) -> &BranchPredictorBase<Self::EntryData>;

    fn base_mut(&mut self) -> &mut BranchPredictorBase<Self::EntryData>;
}

impl<T: UseBranchPredictorBase> BranchPredictor for T {
    fn predict(&self, addr: Addr, target_addr: Addr) -> bool {
        let index = get_index(self, addr);

        let static_prediction = match self.base().static_mode {
            StaticBranchPredictionMode::Always => true,
            StaticBranchPredictionMode::Never => false,
            // Predict taken if backward
            StaticBranchPredictionMode::Directional => addr > target_addr,
        };

        T::simple_predict(
            &self.base().bht[index].data,
            addr,
            target_addr,
            static_prediction,
        )
    }

    fn predict_indirect(&self, addr: Addr) -> (bool, Addr) {
        let index = get_index(self, addr);
        let target_addr = self.base().bht[index].last_indirect_target;

        (self.predict(addr, target_addr), target_addr)
    }

    fn update(&mut self, addr: Addr, did_jump: bool) {
        let index = get_index(self, addr);

        T::simple_update(&mut self.base_mut().bht[index].data, did_jump);
    }

    fn update_indirect(&mut self, addr: Addr, did_jump: bool, actual_target_addr: Addr) {
        self.update(addr, did_jump);

        let index = get_index(self, addr);
        self.base_mut().bht[index].last_indirect_target = actual_target_addr;
    }
}

fn get_index(x: &impl UseBranchPredictorBase, addr: Addr) -> usize {
    (addr & (x.base().bht.len() - 1) as Addr) as usize
}

impl<T: UseBranchPredictorBase> ConstructBranchPredictor for T {
    fn new<F: Fn(usize, usize) -> *mut ()>(
        get_mem: F,
        bht_size_log: u8,
        static_mode: StaticBranchPredictionMode,
    ) -> UnsafeMutRef<dyn BranchPredictor> {
        // These are necessary but not sufficient to assert that Self's only non-zero-sized field is
        // BranchPredictorBase<EntryData>. However, combined with get_base(), we can be reasonably
        // sure
        let _ = TransmuteAssertions::<T, BranchPredictorBase<T::EntryData>>::SIZE;
        let _ = TransmuteAssertions::<T, BranchPredictorBase<T::EntryData>>::ALIGN;

        let len: usize = 1 << bht_size_log;

        let struct_size = size_of::<T>();
        let res_align = align_of::<T>();
        let table_size = size_of::<BhtEntry<T::EntryData>>() * len;
        let table_align = align_of::<BhtEntry<T::EntryData>>();

        let res_mem = get_mem(struct_size, res_align) as *mut T;
        let table_mem = get_mem(table_size, table_align) as *mut BhtEntry<T::EntryData>;

        let mut res = unsafe { UnsafeMutRef::new_from_ptr(res_mem) };

        let base = res.base_mut();
        base.static_mode = static_mode;
        base.bht = unsafe { UnsafeMutRef::new_from_ptr(slice_from_raw_parts_mut(table_mem, len)) };

        unsafe { res.transmute_into::<T>().map_into(|x| x as _) }
    }
}
