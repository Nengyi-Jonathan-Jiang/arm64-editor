use crate::components::Simulator;
use crate::wasm_only::very_unsafe_cell::VeryUnsafeCell;

static SIMULATOR: VeryUnsafeCell<Option<Simulator>> = VeryUnsafeCell::new(None);

// VERY BAD unsafe code
mod dynamic {
    use crate::wasm_only::very_unsafe_cell::VeryUnsafeCell;

    type Ptr = *mut ();

    unsafe extern "C" {
        /// Links to a symbol defined by linker marking the beginning of the heap
        static __heap_base: u8;

        /// Requests JS to expand WASM memory to fit the pointer given. This returns the new memory
        /// limit if the operations succeeded and a null pointer otherwise
        fn request_enough_mem_for_ptr(ptr: Ptr) -> Ptr;
    }

    macro_rules! heap_base {
        () => {
            &raw const __heap_base as Ptr
        };
    }

    static CURR_LIMIT: VeryUnsafeCell<Ptr> = VeryUnsafeCell::new(heap_base!());
    static CURR_END: VeryUnsafeCell<Ptr> = VeryUnsafeCell::new(heap_base!());

    #[unsafe(export_name = "append")]
    pub unsafe extern "C" fn append(num_bytes: usize) -> *mut () {
        // We can do all of this because WASM runs in a single-threaded context

        let curr_end = unsafe { CURR_END.get().as_mut_unchecked() };
        let res = curr_end.clone();

        // Update heap end
        *curr_end = unsafe { curr_end.byte_add(num_bytes) };

        // Request more memory from JS if necessary
        let curr_limit = unsafe { CURR_LIMIT.get().as_mut_unchecked() };
        if *curr_end > *curr_limit {
            let new_limit = unsafe { request_enough_mem_for_ptr(*curr_limit) };
            if new_limit == core::ptr::null_mut() {
                panic!("Failed to request enough memory from JS");
            }
            *curr_limit = new_limit;
        }

        res
    }

    pub unsafe fn reset() {
        unsafe { CURR_END.set(heap_base!()) };
    }
}
