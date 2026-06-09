use crate::transmute_assertions::TransmuteAssertions;
use core::ops::{Deref, DerefMut};
// TODO: figure out if and how we can restruct how long pointee of UnsafeRef needs to live

/// A (non-mut) reference that is GUARANTEED to live as long as needed.
///
/// Unlike pointers, which place the burden of safety at dereferencing time, this wrapper places
/// the burden of safety at construction time.
#[derive(Copy, Clone)]
pub struct UnsafeRef<T: ?Sized> {
    ptr: *const T,
}

impl<T: ?Sized> UnsafeRef<T> {
    /// Use with extreme caution.
    pub unsafe fn new(ptr: &T) -> Self {
        Self { ptr }
    }

    /// Use with even more extreme caution.
    pub unsafe fn new_from_ptr(ptr: *const T) -> Self {
        Self { ptr }
    }

    pub fn as_ref(&self) -> &T {
        unsafe { self.ptr.as_ref_unchecked() }
    }

    // The returned pointer is only valid as long as &self is valid.
    pub fn as_raw(&self) -> *const T {
        self.ptr
    }

    pub fn map_into<U: ?Sized, F: FnOnce(&T) -> &U>(self, f: F) -> UnsafeRef<U> {
        unsafe { UnsafeRef::new(f(self.as_ref())) }
    }
}

impl<T> UnsafeRef<T> {
    pub unsafe fn transmute_into<U: Sized>(self) -> UnsafeRef<U> {
        self.map_into(|x| unsafe { &*(x as *const T as *const U) })
    }
}

impl<T: ?Sized> Deref for UnsafeRef<T> {
    type Target = T;
    fn deref(&self) -> &T {
        self.as_ref()
    }
}

impl<T: ?Sized> Into<*const T> for UnsafeRef<T> {
    fn into(self) -> *const T {
        self.ptr
    }
}

/// A mut reference that is GUARANTEED to live as long as needed.
///
/// Unlike pointers, which place the burden of safety at dereferencing time, this wrapper places
/// the burden of safety at construction time.
pub struct UnsafeMutRef<T: ?Sized> {
    ptr: *mut T,
}

impl<T: ?Sized> UnsafeMutRef<T> {
    /// Use with extreme caution.
    pub unsafe fn new(ptr: &mut T) -> Self {
        Self { ptr }
    }

    /// Use with even more extreme caution. `ptr` must be an exclusive reference.
    pub unsafe fn new_from_ptr(ptr: *mut T) -> Self {
        Self { ptr }
    }

    pub fn as_ref(&self) -> &T {
        unsafe { self.ptr.as_ref_unchecked() }
    }

    pub fn as_mut(&mut self) -> &mut T {
        unsafe { self.ptr.as_mut_unchecked() }
    }

    // The returned pointer is only valid as long as &mut self is valid.
    pub fn as_raw(&mut self) -> *mut T {
        self.ptr
    }

    pub fn map_into<U: ?Sized, F: FnOnce(&mut T) -> &mut U>(mut self, f: F) -> UnsafeMutRef<U> {
        unsafe { UnsafeMutRef::new(f(self.as_mut())) }
    }
}

impl<T> UnsafeMutRef<T> {
    pub unsafe fn transmute_into<U: Sized>(self) -> UnsafeMutRef<U> {
        let _ = TransmuteAssertions::<T, U>::SIZE;

        self.map_into(|x| unsafe { &mut *(x as *mut T as *mut U) })
    }
}

impl<T: ?Sized> Deref for UnsafeMutRef<T> {
    type Target = T;
    fn deref(&self) -> &T {
        self.as_ref()
    }
}

impl<T: ?Sized> DerefMut for UnsafeMutRef<T> {
    fn deref_mut(&mut self) -> &mut T {
        self.as_mut()
    }
}

impl<T: ?Sized> Into<*mut T> for UnsafeMutRef<T> {
    fn into(self) -> *mut T {
        self.ptr
    }
}

