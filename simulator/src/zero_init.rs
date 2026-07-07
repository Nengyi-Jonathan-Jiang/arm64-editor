use core::cell::{Cell, RefCell, UnsafeCell};
use core::marker::{PhantomData, PhantomPinned};

/// A marker trait indicating that a type can be zero-initialized, and that the [`Default`]
/// implementation is equivalent to zero-initialization.
///
/// This can be automatically derived using the [`zeroInit`] derive macro (which must be used with
/// [`macro_rules_attribute::derive`]) when all fields implement ZeroInit:
///
/// ```
/// use macro_rules_attribute::derive;
/// use simulator::zero_init::{ZeroInit, zeroInit};
///
/// #[derive(Default, zeroInit!)]
/// struct Foo {
///     bar: u8,
///     baz: [(f32, usize); 32]
/// }
/// ```
///
/// ```compile_fail
/// use macro_rules_attribute::derive;
/// #[derive(Default, zeroInit!)]
/// struct Foo {
///     bar: u8,
///     baz: [(f32, usize); 32]
/// }
/// ```
pub unsafe trait ZeroInit: Default {}

// Implement ZeroInit for numeric types
unsafe impl ZeroInit for bool {}
unsafe impl ZeroInit for usize {}
unsafe impl ZeroInit for isize {}
unsafe impl ZeroInit for u8 {}
unsafe impl ZeroInit for u16 {}
unsafe impl ZeroInit for u32 {}
unsafe impl ZeroInit for u64 {}
unsafe impl ZeroInit for i8 {}
unsafe impl ZeroInit for i16 {}
unsafe impl ZeroInit for i32 {}
unsafe impl ZeroInit for i64 {}
// Float +0 are represented as all zero so this is ok
unsafe impl ZeroInit for f32 {}
unsafe impl ZeroInit for f64 {}

// Implement ZeroInit for arrays
unsafe impl<T: ZeroInit, const N: usize> ZeroInit for [T; N] where [T; N]: Default {}
// Implement ZeroInit for tuples (including Unit)
unsafe impl ZeroInit for () {}
unsafe impl<T: ZeroInit> ZeroInit for (T,) {}
unsafe impl<T: ZeroInit, U: ZeroInit> ZeroInit for (T, U) {}
unsafe impl<T: ZeroInit, U: ZeroInit, V: ZeroInit> ZeroInit for (T, U, V) {}
unsafe impl<T: ZeroInit, U: ZeroInit, V: ZeroInit, W: ZeroInit> ZeroInit for (T, U, V, W) {}

// Implement ZeroInit for Cells
unsafe impl<T: ZeroInit> ZeroInit for UnsafeCell<T> {}
unsafe impl<T: ZeroInit> ZeroInit for RefCell<T> {}
unsafe impl<T: ZeroInit> ZeroInit for Cell<T> {}

// Implement ZeroInit for phantoms
unsafe impl ZeroInit for PhantomPinned {}
unsafe impl<T> ZeroInit for PhantomData<T> {}

// I can't think of any more simple cases for which ZeroInit should be automatically derivable

#[macro_rules_attribute::derive(Default, zeroInit!)]
struct Foo<T, U: ZeroInit>
where
    T: ZeroInit,
{
    foo: T,
    bar: [U; 12],
    baz: PhantomData<&'static str>
}

// const _: fn() = || {
//     fn assert_zero_init<T: ZeroInit>() {}
//     struct assert_zero_init_helper<T> (PhantomData<T>);
//     impl<T: ZeroInit, U: Default> assert_zero_init_helper<(T, U)> where T: Sized{
//         fn assert() {
//             assert_zero_init::<T>();
//             assert_zero_init::<[U; 12]>();
//             assert_zero_init::<PhantomData<&'static str>>();
//         }
//     }
// };

/// Derive [`ZeroInit`] for a struct whose fields all implement ZeroInit. The struct must also
/// implement or derive [`Default`]
#[allow(non_snake_case)]
#[macro_export]
macro_rules! zeroInit {
    (
        $(#[$struct_meta:meta])*
        $struct_vis:vis struct $StructName:ident
        $(
            <$($generic:ident $($generic_b:ident)? $(: $generic_ty:path)?),+>
        )?
        $(where $(
            $where_ty:ty: $where_bound:path
        ),+)? $(,)?
        {
            $(
                $(#[$field_meta:meta])*
                $field_name:ident : $field_ty:ty
            ),* $(,)?
        }
    ) => (
        unsafe impl $(
            <$($generic $($generic_b)? $(: $generic_ty)?),+>
        )? ZeroInit for $StructName $(
            <$(
                 zeroInit!(@name $generic $($generic_b)? $(: $generic_ty)?)
            ),+>
        )?
        where
            $($($where_ty: $where_bound,)+)?
            $($field_ty: ZeroInit,)*
            (): Sized // Needed to make where clause always correct
        {}

        zeroInit!(@assert
            $StructName
            $(
                <$($generic $($generic_b)? $(: $generic_ty)?),+>
            )?
            $(where $(
                $where_ty: $where_bound
            ),+)?
            { $( $field_ty ),* }
        );
    );

    (@name const $generic:ident $(: $generic_ty:path)?) => {
        $generic
    };

    (@name $generic:ident $($generic_b:ident)? $(: $generic_ty:path)?) => {
        $generic
    };

    (@assert
        $StructName:ident
        <$($generic:ident $($generic_b:ident)? $(: $generic_ty:path)?),+>
        $(where $(
            $where_ty:ty: $where_bound:path
        ),+)?
        { $($field_ty:ty),* }
    ) => {
        #[allow(unused, non_camel_case_types)]
        const _: fn() = || {
            fn assert_zero_init<T: ZeroInit>() {}
            struct assert_zero_init_helper<T> (PhantomData<T>);

            impl
            <$($generic $($generic_b)? $(: $generic_ty)?),+>
            assert_zero_init_helper
            <($(zeroInit!(@name $generic $($generic_b)? $(: $generic_ty)?)),+)>
            $(where $($where_ty: $where_bound),+)?
            {
                fn assert() {
                    $(
                        assert_zero_init::<$field_ty>();
                    )*
                }
            }
        };
    }
}

/// Derive [`ZeroInit`] for a struct whose fields all implement ZeroInit. The struct must also
/// implement or derive [`Default`]
pub use zeroInit;
