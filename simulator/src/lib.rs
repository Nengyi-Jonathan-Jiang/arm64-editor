#![no_std]
#![allow(incomplete_features)]
#![feature(generic_const_exprs)]

// Enable std if we are testing
#[cfg(test)]
extern crate std;

// Disallow testing WASM
#[cfg(all(test, target_arch = "wasm32"))]
compile_error!("Cannot test on WASM");

pub mod components;
pub mod params;

// Only include interop when not testing (otherwise a lot of stuff breaks)
mod transmute_assertions;
mod unsafe_ref;
#[cfg(target_arch = "wasm32")]
mod wasm;
// Without wasm panic handler we also have to define our own

#[cfg(not(test))]
const _: () = {
    use core::panic::PanicInfo;

    #[unsafe(export_name = "panicBufferLen")]
    static PANIC_MSG_BUFFER_LEN: usize = 1024;

    #[unsafe(export_name = "panicBuffer")]
    static mut PANIC_MSG: [u8; PANIC_MSG_BUFFER_LEN] = [0; PANIC_MSG_BUFFER_LEN];

    #[unsafe(export_name = "clearPanicBuffer")]
    fn clear_panic_message() {
        unsafe {
            PANIC_MSG = [0; PANIC_MSG_BUFFER_LEN];
        }
    }

    #[panic_handler]
    fn panic(info: &PanicInfo) -> ! {
        if let Some(msg) = info.message().as_str() {
            unsafe {
                #[allow(static_mut_refs)]
                core::ptr::copy_nonoverlapping(
                    msg.as_ptr(),
                    PANIC_MSG.as_mut_ptr(),
                    core::cmp::min(msg.len(), PANIC_MSG_BUFFER_LEN),
                );
            }
        }

        #[cfg(target_arch = "wasm32")]
        core::arch::wasm32::unreachable();
        #[cfg(not(target_arch = "wasm32"))]
        loop {}
    }
};
