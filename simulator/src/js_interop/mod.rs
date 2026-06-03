mod globals;
mod js_interop;
mod very_unsafe_cell;

const _: () = {
    use core::panic::PanicInfo;

    #[panic_handler]
    fn panic(_: &PanicInfo) -> ! {
        #[cfg(target_arch = "wasm32")]
        core::arch::wasm32::unreachable();
        #[cfg(not(target_arch = "wasm32"))]
        unreachable!();
    }
};
