#![no_std]

// Enable std if we are testing
#[cfg(test)] extern crate std;

// Disallow testing WASM
#[cfg(all(test, target_arch = "wasm32"))]
compile_error!("Cannot test on WASM");

pub mod components;
pub mod params;

// Only include interop when not testing (otherwise a lot of stuff breaks)
#[cfg(target_arch = "wasm32")]
mod wasm_only;

// Without wasm panic handler we also have to define our own

#[cfg(not(test))]
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
