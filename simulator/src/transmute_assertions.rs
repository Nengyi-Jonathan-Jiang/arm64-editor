// Based on techniques from https://geo-ant.github.io/blog/2023/rust-type-level-programming/

/// Assertions that help check that T is transmutable to U
///
/// This checks for compatible size and alignment
pub struct TransmuteAssertions<T, U> {
    phantom: core::marker::PhantomData<(T, U)>,
}

impl<T, U> TransmuteAssertions<T, U> {
    /// To transmute T to U, T and U must be the same size
    pub const SIZE: () = assert!(
        size_of::<T>() == size_of::<U>(),
        concat!("Types are not the same size")
    );

    /// To transmute T to U, T must be at least as aligned as U
    pub const ALIGN: () = assert!(
        align_of::<T>() >= align_of::<U>(),
        concat!("Types do not have the same alignment")
    );
}
