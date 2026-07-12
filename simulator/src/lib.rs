#![no_std]
#![allow(incomplete_features)]
#![feature(unsafe_cell_access)]
#![feature(decl_macro)]
#![feature(const_type_name)]
// Enable std if we are testing
#[cfg(feature = "std")]
extern crate std;

use crate::alloc_interface::{IAlloc, IAllocation};
use crate::extend_meta::extend_meta;
use core::ops::{Deref, DerefMut};

pub mod components;
pub mod params;

pub mod transmute_assertions;

extend_meta! {
    #[cfg(target_arch = "wasm32")]
    mod wasm;
    pub type Alloc = wasm::wasm_allocator::WASMAlloc;
}
extend_meta! {
    #[cfg(all(feature="std", not(target_arch = "wasm32")))]
    mod native_alloc;
    pub type Alloc = native_alloc::NativeAllocator;
}

#[cfg(all(target_arch = "wasm32", feature = "std"))]
compile_error!("Cannot have std when target_arch=wasm32");
#[cfg(all(not(target_arch = "wasm32"), not(feature = "std")))]
compile_error!("Alloc is only defined when target_arch=wasm32 or feature=std");

pub type Allocation<T> = <Alloc as IAlloc>::Allocation<T>;

mod alloc_interface;
mod extend_meta;
mod zero_init;

// Without wasm panic handler we also have to define our own
#[cfg(all(not(feature = "std"), not(test)))]
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
