use crate::components::mem_access::DummyMemoryAccess;
use crate::components::pipeline::DummyPipeline;
use crate::components::{BranchPredictor, MemoryAccess, Pipeline, Simulator, branch_predictor};
use crate::params::{
    BranchPredictorParams, CacheParams, DynamicBranchPredictor, PipelineMode, PipelineParams,
    SimulatorParams,
};
use crate::unsafe_ref::UnsafeMutRef;
use crate::wasm::wasm_mutex::Mutex;
use core::mem;

// Compiler puts this in a "readonly" section, but it doesn't actually matter because the underlying
// WASM memory, being a normal ArrayBuffer, is writable by JS
#[unsafe(export_name = "paramsPtr")]
static VOLATILE_PARAMS: SimulatorParams = unsafe { mem::zeroed() };

static SAVED_PARAMS: Mutex<SimulatorParams> = Mutex::new(VOLATILE_PARAMS);

#[unsafe(export_name = "simulatorPtr")]
static SIMULATOR: Mutex<Option<Simulator>> = Mutex::new(None);

#[unsafe(export_name = "updateParams")]
unsafe fn update_simulator_params() {
    unsafe {
        // Update saved params from volatile memory
        *SAVED_PARAMS.lock() = (&raw const VOLATILE_PARAMS).read_volatile();
        // Set simulator back to None so next access can reinitialize it with the new params
        dealloc_simulator();
    }
}

unsafe fn dealloc_simulator() {
    // Reset dynamic memory held by simulator
    unsafe { dynamic::reset() };
    // Erase simulator data
    *SIMULATOR.lock() = None;
}

fn alloc_pipeline(params: PipelineParams) -> UnsafeMutRef<dyn Pipeline> {
    let PipelineParams {
        pipeline_mode: _,
        cycle_times: _,
    } = params;

    // TODO: un-dummy this
    DummyPipeline::new()

    // match pipeline_mode {
    //     PipelineMode::None => {}
    //     PipelineMode::ThreeStage => {}
    //     PipelineMode::FiveStage => {}
    // }
}

fn alloc_cache(params: CacheParams) -> UnsafeMutRef<dyn MemoryAccess> {
    let CacheParams {
        associativity,
        block_size_log,
        num_sets_log,
        policy,
        write_mode,
    } = params;

    // TODO: un-dummy this
    DummyMemoryAccess::new()
}

fn alloc_branch_predictor(params: BranchPredictorParams) -> UnsafeMutRef<dyn BranchPredictor> {
    use crate::components::branch_predictor::ConstructBranchPredictor;

    let BranchPredictorParams {
        bht_size_log,
        dynamic_predictor,
        static_mode,
    } = params;

    match dynamic_predictor {
        DynamicBranchPredictor::None => {
            branch_predictor::Predictor0::new(dynamic::append_raw, bht_size_log, static_mode)
        }
        DynamicBranchPredictor::OneBitSaturating => {
            branch_predictor::Predictor1::new(dynamic::append_raw, bht_size_log, static_mode)
        }
        DynamicBranchPredictor::TwoBitSaturating => {
            branch_predictor::Predictor2::new(dynamic::append_raw, bht_size_log, static_mode)
        }
    }
}

#[unsafe(export_name = "allocSimulator")]
fn alloc_simulator() -> Simulator {
    let SimulatorParams {
        cache_params,
        pipeline_params,
        branch_prediction,
    } = *SAVED_PARAMS.lock();

    Simulator::new(
        alloc_pipeline(pipeline_params),
        alloc_cache(cache_params),
        alloc_branch_predictor(branch_prediction)
    )
}

fn with_simulator<F: FnOnce(&mut Simulator) -> ()>(f: F) {
    let mut simulator_guard = SIMULATOR.lock();

    let simulator = simulator_guard.get_or_insert_with(|| alloc_simulator());
    f(simulator);

    drop(simulator_guard); // Explicitly release the lock
}

// VERY BAD unsafe code.
mod dynamic {
    use core::ptr::slice_from_raw_parts_mut;

    use crate::unsafe_ref::UnsafeMutRef;
    use crate::wasm::wasm_mutex::Mutex;
    use crate::zero_init::ZeroInit;

    type _Ptr = *mut ();

    static CURR_LIMIT: Mutex<_Ptr> = Mutex::new(heap_base());
    static CURR_END: Mutex<_Ptr> = Mutex::new(heap_base());

    /// Allocate the given number of bytes on the heap with the given alignment, returning a pointer
    /// to the allocated (uninitialized) memory
    pub fn append_raw(num_bytes: usize, alignment: usize) -> *mut () {
        debug_assert!(alignment.is_power_of_two());

        let mut curr_end = CURR_END.lock();
        let mut curr_limit = CURR_LIMIT.lock();

        // Align the pointer to the given alignment
        *curr_end = unsafe { curr_end.byte_add(curr_end.align_offset(alignment)) };

        let res = *curr_end;

        // Update heap end by given size
        *curr_end = unsafe { curr_end.byte_add(num_bytes) };

        // Request more memory from JS if necessary to make the pointer valid
        if *curr_end > *curr_limit {
            let new_limit = unsafe { request_enough_mem_for_ptr(*curr_limit) };
            if new_limit == core::ptr::null_mut() {
                // Make sure to drop guards before panicking
                drop((curr_end, curr_limit));

                panic!("Failed to request enough memory from JS");
            }

            *curr_limit = new_limit;
        }

        res
    }

    pub unsafe fn append<T: ZeroInit>() -> UnsafeMutRef<T> {
        let ptr = append_raw(size_of::<T>(), align_of::<T>()) as *mut T;
        unsafe { UnsafeMutRef::new(ptr.as_mut_unchecked()) }
    }

    pub fn append_slice<T: ZeroInit>(len: usize) -> UnsafeMutRef<[T]> {
        let ptr = append_raw(len * size_of::<T>(), align_of::<T>()) as *mut T;
        let slice_ptr = slice_from_raw_parts_mut(ptr, len);
        unsafe { UnsafeMutRef::new(slice_ptr.as_mut_unchecked()) }
    }

    /// Clears all data on the heap. Only do this if we know no references remain to heap data.
    pub unsafe fn reset() {
        *CURR_END.lock() = heap_base();
    }

    unsafe extern "C" {
        /// Links to a symbol defined by the linker that marks the beginning of the heap
        static __heap_base: u8;
    }

    #[link(wasm_import_module = "env")]
    unsafe extern "C" {
        /// Requests JS to expand WASM memory to fit the pointer given. This returns the new memory
        /// limit if the operations succeeded and a null pointer otherwise
        fn request_enough_mem_for_ptr(ptr: _Ptr) -> _Ptr;
    }

    #[allow(unused_unsafe)] // TODO: why does cargo check warn about this?
    const fn heap_base() -> _Ptr {
        (unsafe { &raw const __heap_base }) as _Ptr
    }
}
