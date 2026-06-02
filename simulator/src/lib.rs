#![no_std]

mod js_interop;
mod simulator;
mod components;

#[cfg(not(test))]
const _ : () = { // A bit hacky to make cfg only apply to
    use core::panic::PanicInfo;
    #[panic_handler]
    fn panic(_: &PanicInfo) -> ! {
        // For Wasm, a common behavior is to trigger an unreachable instruction
        core::arch::wasm32::unreachable();
    }
};