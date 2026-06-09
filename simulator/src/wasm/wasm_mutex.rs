// Barebones mutex implementation for (single-threaded) WebAssembly
// If the target is not wasm32, including this module will cause a compiler error

#[cfg(not(target_arch = "wasm32"))]
// Double-triple check that we don't use this module on non-wasm targets
compile_error!("wasm_mutex is only for wasm");

use core::cell::UnsafeCell;
use core::ops::{Deref, DerefMut};

pub struct Mutex<T> {
    locked: UnsafeCell<bool>,
    data: UnsafeCell<T>,
}

unsafe impl<T> Send for Mutex<T> {}
unsafe impl<T> Sync for Mutex<T> {}

impl<T> Mutex<T> {
    pub const fn new(t: T) -> Self {
        Self {
            locked: UnsafeCell::new(false),
            data: UnsafeCell::new(t),
        }
    }

    /// Acquires a lock on the mutex, returning a guard that can be used to access the data. The
    /// lock will be released when the guard is dropped.
    pub fn lock(&self) -> MutexGuard<T> {
        unsafe {
            let locked = self.locked.get();
            assert!(!*locked, "cannot recursively acquire mutex");
            *locked = true;
        };

        MutexGuard { lock: self }
    }
}

pub struct MutexGuard<'a, T> {
    lock: &'a Mutex<T>,
}

impl<T> Deref for MutexGuard<'_, T> {
    type Target = T;

    fn deref(&self) -> &T {
        unsafe { &*self.lock.data.get() }
    }
}

impl<T> DerefMut for MutexGuard<'_, T> {
    fn deref_mut(&mut self) -> &mut T {
        unsafe { &mut *self.lock.data.get() }
    }
}

impl<T> Drop for MutexGuard<'_, T> {
    #[inline]
    fn drop(&mut self) {
        unsafe {
            self.lock.locked.get().write(false);
        }
    }
}
