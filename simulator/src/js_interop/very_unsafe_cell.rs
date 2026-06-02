use core::cell::UnsafeCell;
use core::ops::Deref;

/// VERY UNSAFE wrapper type with interior mutability that implements Send and Sync for an arbitrary
/// type. The memory layout of this type is guaranteed to be the same as its wrapped value. Should
/// only be used when it is known that no
#[repr(transparent)]
pub struct VeryUnsafeCell<T> {
    value: UnsafeCell<T>,
}

impl<T: Sized> VeryUnsafeCell<T> {
    pub const fn new(value: T) -> Self {
        Self {
            value: UnsafeCell::new(value),
        }
    }

    pub unsafe fn set(&self, value: T) -> T {
        unsafe { self.get().replace(value) }
    }
}

impl<T: Sized + Copy> VeryUnsafeCell<T> {
    pub const unsafe fn clone(&self) -> Self {
        Self::new(unsafe { *self.value.get() })
    }
}

unsafe impl<T> Send for VeryUnsafeCell<T> {}
unsafe impl<T> Sync for VeryUnsafeCell<T> {}

impl<T> Deref for VeryUnsafeCell<T> {
    type Target = UnsafeCell<T>;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}
