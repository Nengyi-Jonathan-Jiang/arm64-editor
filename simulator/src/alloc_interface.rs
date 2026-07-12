/// Defines an interface for bump allocation, which is the allocation method used by the rest of the
/// code. This may be implemented for WASM using WASM linear memory or for normal
use crate::transmute_assertions::check_transmute;
use crate::zero_init::ZeroInit;
use core::mem::{MaybeUninit, zeroed};
use core::slice::from_raw_parts_mut;

/// A pointer type that uniquely owns a heap allocation of type `T`
pub unsafe trait IAllocation: core::ops::DerefMut + Sized {
    /// Result type of map-like operations
    type MapResult<T: ?Sized>: IAllocation<Target = T>;

    /// Maps the value, reusing the allocation. `f` takes a reference to the current value and
    /// returns a reference to the new value.
    ///
    /// Safety: The return value of `f` must point to exactly the same memory as its input
    unsafe fn unsized_map<U: ?Sized>(
        self,
        f: impl FnOnce(&mut Self::Target) -> &mut U,
    ) -> Self::MapResult<U>;

    /// Maps the value, reusing the allocation. `f` takes a valid pointer `src` to the current value
    /// and a pointer `dst` aliased to the same memory location.
    ///
    /// Safety: `f` must result in `dst` containing a valid value. In most cases, the original value
    /// in `src` must also be [`Drop`]ped.
    unsafe fn map_raw<U>(self, f: impl FnOnce(*mut Self::Target, *mut U)) -> Self::MapResult<U>
    where
        Self::Target: Sized,
    {
        check_transmute!(Self::Target as U);

        unsafe {
            // Safety: T is the same size as U  so src points to the same memory as dst
            self.unsized_map::<U>(move |src| {
                let src = src as *mut Self::Target;
                let dst = src as *mut U;

                f(src, dst);
                // Safety: guaranteed by `f`
                dst.as_mut_unchecked()
            })
        }
    }

    /// Maps the slice element-by-element, reusing the allocation. `f` takes a valid pointer `src`
    /// to the current element, a pointer `dst` aliased to the same memory location, and the element
    /// index.
    ///
    /// Safety: `f` must result in `dst` containing a valid value. In most cases, the original value
    /// in `src` must also be [`Drop`]ped.
    unsafe fn map_slice_raw<T, U>(
        self,
        mut f: impl FnMut(*mut T, *mut U, usize),
    ) -> Self::MapResult<[U]>
    where
        Self: IAllocation<Target = [T]>,
    {
        check_transmute!(T as U);
        unsafe {
            // Safety: T and U are the same size and the length of the slice doesn't change, so the
            // returned slice points to exactly the same memory as `src`
            self.unsized_map::<[U]>(move |src| {
                let len = src.len();
                let src = src as *mut [T];

                let base = src as *mut T;

                for i in 0..len {
                    // Safety: the original slice is valid.
                    let el_src = base.add(i);
                    let el_dst = el_src as *mut U;
                    f(el_src, el_dst, i);
                }

                // Safety: src is now a pointer to slice with valid elements of type U
                from_raw_parts_mut(src as *mut T as *mut U, len)
            })
        }
    }

    /// Maps the value, reusing the allocation.
    fn map<U>(self, f: impl FnOnce(Self::Target) -> U) -> Self::MapResult<U>
    where
        Self::Target: Sized,
    {
        check_transmute!(Self::Target as U);

        unsafe {
            // Safety: by `dst.write(...)`
            self.map_raw(|src, dst: *mut U| {
                // Safety: src is a valid pointer to T
                let src_val: Self::Target = src.read();

                let dst_val: U = f(src_val);
                // Safety: raw is valid for writes and correctly aligned (due to above check)
                dst.write(dst_val);
            })
        }
    }

    /// Maps the slice element-by-element, reusing the allocation.
    fn map_slice<T, U>(self, mut f: impl FnMut(T, usize) -> U) -> Self::MapResult<[U]>
    where
        Self: IAllocation<Target = [T]>,
    {
        check_transmute!(T as U);
        unsafe {
            // Safety: by `dst.write(...)`
            self.map_slice_raw::<T, U>(move |src, dst, i| {
                // Safety: src is a valid pointer to T
                let src_val = src.read();

                let dst_val = f(src_val, i);
                // Safety: raw is valid for writes and correctly aligned (due to above check)
                dst.write(dst_val);
            })
        }
    }

    /// Initialize the allocation.
    ///
    /// Safety: `f` must initialize its parameter.
    unsafe fn init<T>(self, f: impl FnOnce(&mut MaybeUninit<T>)) -> Self::MapResult<T>
    where
        Self: IAllocation<Target = MaybeUninit<T>>,
    {
        unsafe {
            // Safety: guaranteed by `f`
            self.map_raw::<T>(|src, _| {
                // Safety: by validity of src
                f(src.as_mut_unchecked())
            })
        }
    }

    /// Initialize the allocation.
    ///
    /// Safety: `f` must initialize its (first) parameter.
    unsafe fn init_slice<T>(
        self,
        mut f: impl FnMut(&mut MaybeUninit<T>, usize),
    ) -> Self::MapResult<[T]>
    where
        Self: IAllocation<Target = [MaybeUninit<T>]>,
    {
        unsafe {
            // Safety: guaranteed by `f`
            self.map_slice_raw::<MaybeUninit<T>, T>(move |src, _, i| {
                // Safety: by validity of src
                f(src.as_mut_unchecked(), i)
            })
        }
    }

    /// Zero-init the allocation
    fn init_zeroed<T: ZeroInit>(self) -> Self::MapResult<T>
    where
        Self: IAllocation<Target = MaybeUninit<T>>,
    {
        unsafe {
            // Safety: by `x.write(...)`
            self.init(|x| {
                // Safety: T is ZeroInit
                x.write(zeroed());
            })
        }
    }

    /// Zero-init the allocation
    fn init_slice_zeroed<T: ZeroInit>(self) -> Self::MapResult<[T]>
    where
        Self: IAllocation<Target = [MaybeUninit<T>]>,
    {
        unsafe {
            // Safety: by `x.write(...)`
            self.init_slice(|x, _| {
                // Safety: T is ZeroInit
                x.write(zeroed());
            })
        }
    }

    /// Give a type to a raw allocation.
    ///
    /// Safety: `size_of::<U>()` must be exactly the size of the allocation.
    unsafe fn to_uninit<U>(self) -> Self::MapResult<MaybeUninit<U>>
    where
        Self: IAllocation<Target = ()>,
    {
        // Safety: by safety of <...>.as_mut_unchecked()
        unsafe {
            self.unsized_map::<MaybeUninit<U>>(|x| {
                // Safety: All bit patterns are valid for MaybeUninit; guarantees on size of U by
                // safety of containing function
                (x as *mut () as *mut MaybeUninit<U>).as_mut_unchecked()
            })
        }
    }

    /// Give a slice type to a raw allocation.
    ///
    /// Safety: `size_of::<U>() * len` must be exactly the size of the allocation.
    unsafe fn to_uninit_slice<U>(self, len: usize) -> Self::MapResult<[MaybeUninit<U>]>
    where
        Self: IAllocation<Target = ()>,
    {
        unsafe {
            // Safety: by safety of `from_raw_parts_mut(...)`
            self.unsized_map::<[MaybeUninit<U>]>(|x| {
                // Safety: All bit patterns are valid for MaybeUninit; guarantees on size of U and
                // len by safety of containing function
                from_raw_parts_mut(x as *mut () as *mut MaybeUninit<U>, len)
            })
        }
    }

    unsafe fn transmute<U: Sized>(self) -> Self::MapResult<U> {
        unsafe { self.unsized_map(|x| (x as *mut Self::Target as *mut U).as_mut_unchecked()) }
    }

    unsafe fn transmute_slice<T, U>(self) -> Self::MapResult<[U]>
    where
        Self: IAllocation<Target = [T]>,
    {
        unsafe { self.unsized_map(|x| from_raw_parts_mut(x as *mut [T] as *mut U, x.len())) }
    }
}

/// A simple bump allocator, providing a method to reset the "next pointer" once all allocations are
/// dropped
pub unsafe trait IAlloc {
    type Allocation<T: ?Sized>: IAllocation<Target = T>;

    /// Allocate the given number of bytes with the given alignment
    fn append_raw(num_bytes: usize, alignment: usize) -> Self::Allocation<()>;

    /// Allocate an uninitialized `T`
    fn append_uninit<T: Sized>() -> Self::Allocation<MaybeUninit<T>>
    where
        Self::Allocation<()>:
            IAllocation<MapResult<MaybeUninit<T>> = Self::Allocation<MaybeUninit<T>>>,
    {
        unsafe { Self::append_raw(size_of::<T>(), align_of::<T>()).to_uninit::<T>() }
    }

    /// Allocate an uninitialized `[T]`
    fn append_uninit_slice<T: ZeroInit>(len: usize) -> Self::Allocation<[MaybeUninit<T>]>
    where
        Self::Allocation<()>:
            IAllocation<MapResult<[MaybeUninit<T>]> = Self::Allocation<[MaybeUninit<T>]>>,
    {
        unsafe { Self::append_raw(size_of::<T>() * len, align_of::<T>()).to_uninit_slice(len) }
    }

    /// Invalidates all previous allocations.
    fn reset();
}
