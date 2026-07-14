use core::cell::{Cell, RefCell, UnsafeCell};
use core::marker::{PhantomData, PhantomPinned};
use hybrid_array::{Array, ArraySize};

/// A marker trait indicating that a type can be zero-initialized, and that the [`Default`]
/// implementation is equivalent to zero-initialization.
///
/// This can be automatically derived using the [`zeroInit`] derive macro (which must be used with
/// [`macro_rules_attribute::derive`]) when all fields implement ZeroInit.
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
// Implement ZeroInit for typenum arrays
unsafe impl<T: ZeroInit, N: ArraySize> ZeroInit for Array<T, N> where T: Default {}
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

// I can't think of any more simple cases for which ZeroInit should have blanket implementations

//noinspection DuplicatedCode
/// See [`zeroInit`]
pub macro zeroInit_lenient {
    // Tuple struct with generics
    (
        $(#[$m:meta])*
        $v:vis struct $n:ident <
            // Lifetime params, which are guaranteed to come before generic params in valid Rust
            $($l:lifetime$(:$l2:tt$(+$l3:tt)*)?),*$(,)?
            // Generic params (type or const), optionally with defaults
            $($g:ident$($g2:ident)?$(:$g3:tt$(+$g4:tt)*)?$(=$($_:tt)?$(-$_2:literal)?)?),*$(,)?
        >
        // Tuple struct body
        ($($f:ty),*)
        // Where clause and trailing semicolon (nonempty due to trailing semicolon)
        $($r:tt)+
    ) => (
        // Generate the impl
        helper::zeroInit_impl!(
            $n
            <$(($l$(:$l2$(+$l3)*)?)),*;$(($g $($g2)?$(:$g3$(+$g4)*)?)),*>
            ()
            $($r)+
            // Generate body with named fields (names will be discarded)
            { $(__: $f),* }
        );
    ),
    // Standard struct with generics
    (
        $(#[$m:meta])*
        $v:vis struct $n:ident <
            $($l:lifetime$(:$l2:tt$(+$l3:tt)*)?),*$(,)?
            $($g:ident$($g2:ident)?$(:$g3:tt$(+$g4:tt)*)?$(=$($_:tt)?$(-$_2:literal)?)?),*$(,)?
        >
        // Where clause and struct body (nonempty due to struct body)
        $($r:tt)+
    ) => (
        helper::zeroInit_impl!(
            $n
            <$(($l$(:$l2$(+$l3)*)?)),*;$(($g $($g2)?$(:$g3$(+$g4)*)?)),*>
            ()
            $($r)+
        );
    ),
    // Tuple struct no generics
    (
        $(#[$m:meta])*
        $v:vis struct $n:ident
        ($($f:ty),*)
        $($r:tt)+
    ) => (
        helper::zeroInit_impl!( $n () $($r)* { $(__: $f),* });

        compile_error!(
            "zeroInit_lenient should not be used on non-generic structs (use zeroInit instead)"
        )
    ),
    // Standard struct no generics
    (
        $(#[$m:meta])*
        $v:vis struct $n:ident
        $($r:tt)+
    ) => (
        helper::zeroInit_impl!( $n () $($r)+ );

        compile_error!(
            "zeroInit_lenient should not be used on non-generic structs (use zeroInit instead)"
        )
    )
}

//noinspection DuplicatedCode
/// When used with [`macro_rules_attribute::derive`], derives an implementation of [`ZeroInit`] for
/// a struct whose fields are `ZeroInit`.
///
/// Example usage:
/// ```
/// # use crate::simulator::zero_init::{zeroInit, zeroInit_lenient, ZeroInit};
/// use macro_rules_attribute::derive;
///
/// # #[derive(Default, zeroInit_lenient!)]
/// # struct Qux<T>(core::marker::PhantomData<T>);
///
/// #[derive(Default, zeroInit!)]
/// struct Foo (u8, [(f32, usize); 16]);
///
/// #[derive(Default, zeroInit!)]
/// struct Foo2<A: ZeroInit> where Qux<A>: ZeroInit {
///     bar: (A, Qux<A>),
///     baz: usize
/// }
/// ```
///
/// whereas these will fail:
/// ```compile_fail
/// # use crate::simulator::zero_init::{zeroInit, zeroInit_lenient, ZeroInit};
/// # use std::string::String;
/// # use std::marker::PhantomData;
/// # use macro_rules_attribute::derive;
///
/// #[derive(Default, zeroInit!)]
/// struct Foo3(String); // error
/// //          ^^^^^^ the trait `ZeroInit` is not implemented for `String`
/// ```
/// ```compile_fail
/// # use crate::simulator::zero_init::{zeroInit, zeroInit_lenient, ZeroInit};
/// # use std::string::String;
/// # use std::marker::PhantomData;
/// # use macro_rules_attribute::derive;
///
/// #[derive(Default, zeroInit!)]
/// struct Foo4<T: Default> {
///     bar: PhantomData<T>, // Ok, PhantomData are ZeroInit, but
///     baz: [T; 32] // error
/// //       ^^^^^^^ the trait `ZeroInit` is not implemented for `T`
/// }
/// ```
///
/// If `Foo4` in the previous example should implement `ZeroInit` only sometimes, we can make the
/// compilation succeed by using [`zeroInit_lenient`] instead (in which case where bounds will be
/// inserted on the trait impl to maintain correctness):
///
/// ```
/// # use crate::simulator::zero_init::{zeroInit, zeroInit_lenient, ZeroInit};
/// # use std::string::String;
/// # use std::marker::PhantomData;
/// # use macro_rules_attribute::derive;
///
/// #[derive(Default, zeroInit_lenient!)]
/// struct Foo4<T> {
///     bar: PhantomData<T>,
///     baz: [T; 32] // Ok, macro adds `[T; 32]: ZeroInit`
/// }
/// ```
///
/// The difference is that `zeroInit_lenient` does not require fields to implement `ZeroInit` for
/// all possible generic arguments and derives the trait only when they do, whereas `zeroInit`
/// requires fields to always implement `ZeroInit` and always derives the trait.
pub macro zeroInit {
    // Tuple struct with generics
    (
        $(#[$m:meta])*
        $v:vis struct $n:ident <
            // Lifetime params, which are guaranteed to come before generic params in valid Rust
            $($l:lifetime$(:$l2:tt$(+$l3:tt)*)?),*$(,)?
            // Generic params (type or const), optionally with defaults
            $($g:ident$($g2:ident)?$(:$g3:tt$(+$g4:tt)*)?$(=$($_:tt)?$(-$_2:literal)?)?),*$(,)?
        >
        // Tuple struct body
        ($($f:ty),*)
        // Where clause and trailing semicolon (nonempty due to trailing semicolon)
        $($r:tt)+
    ) => (
        // Generate the impl
        helper::zeroInit_impl!(
            $n
            <
                // Paste parenthesized lifetime params. Parenthesis are used for easy parsing in the
                // helper macro
                $((
                    $l$(:$l2$(+$l3)*)?
                )),*
                ;
                // Paste parenthesized generic params (without defaults)
                $((
                    $g $($g2)?$(:$g3$(+$g4)*)?
                )),*
            >
            ()
            $($r)+
            // Generate body with named fields (names will be discarded)
            { $(__: $f),* }
            assert
        );
    ),
    // Standard struct with generics
    (
        $(#[$m:meta])*
        $v:vis struct $n:ident <
            $($l:lifetime$(:$l2:tt$(+$l3:tt)*)?),*$(,)?
            $($g:ident$($g2:ident)?$(:$g3:tt$(+$g4:tt)*)?$(=$($_:tt)?$(-$_2:literal)?)?),*$(,)?
        >
        // Where clause and struct body (nonempty due to struct body)
        $($r:tt)+
    ) => (
        helper::zeroInit_impl!(
            $n
            <$(($l$(:$l2$(+$l3)*)?)),*;$(($g $($g2)?$(:$g3$(+$g4)*)?)),*>
            ()
            $($r)+
            assert
        );
    ),
    // Tuple struct no generics
    (
        $(#[$m:meta])*
        $v:vis struct $n:ident
        ($($f:ty),*)
        $($r:tt)+
    ) => (
        helper::zeroInit_impl!( $n () $($r)* { $(__: $f),* } assert);
    ),
    // Standard struct no generics
    (
        $(#[$m:meta])*
        $v:vis struct $n:ident
        $($r:tt)+
    ) => (
        helper::zeroInit_impl!( $n () $($r)+ assert);
    )
}

// noinspection DuplicatedCode
#[allow(unused_macros)]
mod helper {
    /// Helper macro used in zeroInit
    pub macro zeroInit_impl {
        // Base case -- without generate assertion
        (
            $n:ident
            $(<$(($l:lifetime$($l2:tt)*)),*;$(($($g:tt)+)),*>)?
            ($($w:tt)*)
            // Empty structs (no tuple or named body) will not generate a body here
            $({
                $(
                $(#[$_m:meta])*
                $_f:ident : $field_ty:ty
                ),* $(,)?
            })?
        ) => {
            //          Paste generic args
            unsafe impl $(<$($l$($l2)*,)*$($($g)+,)*>)? $crate::zero_init::ZeroInit
            //  Instantiate target with generic args
            for $n $(<$($l,)*$(zeroInit_arg_name!($($g)+)),*>)?
            where
            // Leniently allow Self to not be Default
            Self: Default,
            // We still need to check that fields implement ZeroInit -- instead of a hard assertion,
            // we can do this through where clauses
            $($($field_ty: $crate::zero_init::ZeroInit,)*)?
            // Paste where clauses from the original declaration
            $($w)*
            {}
        },
        // Base case -- with generate assertion. This generates a compile time check that all fields
        // are ZeroInit no matter what the generic args are
        (
            $n:ident
            $(<$(($l:lifetime$($l2:tt)*)),*;$(($($g:tt)+)),*>)?
            ($($w:tt)*)
            // Empty structs (no tuple or named body) will not generate a body here
            $({
                $(
                $(#[$_m:meta])*
                $_f:ident : $field_ty:ty
                ),* $(,)?
            })?
            // Dummy marker
            $_:ident
        ) => {
            unsafe impl $(<$($l$($l2)*,)*$($($g)+,)*>)? $crate::zero_init::ZeroInit
            for $n $(<$($l,)*$(zeroInit_arg_name!($($g)+)),+>)?
            where
            // Necessary in case there are no other where clauses
            Self: Sized,
            // Paste where clauses from the original declaration
            $($w)*
            {}

            // Unnamed constant for compile-time checking of type constraints
            #[allow(unused)]
            const _: fn() = || {
                // Compile time assertion that T is ZeroInit, with nice error messages
                fn assert_fields_zero_init<T: $crate::zero_init::ZeroInit>() {}
                // Dummy struct used to quantify over generic arguments
                struct AssertHelper<T> (core::marker::PhantomData<T>);

                impl $(<$($l$($l2)*,)*$($($g)+,)*>)?
                AssertHelper
                <($($(zeroInit_arg_use!($($g)+)),*)?)>
                where
                (): Sized,
                $($w)*
                {
                    fn assert_fields_zero_init() {
                        $($(assert_fields_zero_init::<$field_ty>();)*)?
                    }
                }
            };
        },
        // Consume the "where" of the where clause
        (
            $n:ident $(<$(($($l:tt)+)),*;$(($($g:tt)+)),*>)?
            ($($w:tt)*)
            where $($rest:tt)*
        ) => {
            zeroInit_impl!(
                 $n $(<$(($($l)+)),*;$(($($g)+)),*>)? ($($w)*) $($rest)*
            );
        },
        // Consume the trailing semicolon in a tuple or empty struct
        (
            $n:ident $(<$(($($l:tt)+)),*;$(($($g:tt)+)),*>)?
            ($($w:tt)*)
            ; $($rest:tt)*
        ) => {
            zeroInit_impl!(
                 $n $(<$(($($l)+)),*;$(($($g)+)),*>)? ($($w)*) $($rest)*
            );
        },
        // Process one where clause element
        (
            $n:ident $(<$(($($l:tt)+)),*;$(($($g:tt)+)),*>)?
            ($($w:tt)*)
            $w_item:tt
            // Only process w_item if rest is non-empty -- otherwise, w_item should be interpreted as
            // struct body
            $($rest:tt)+
        ) => {
            zeroInit_impl!(
                 $n $(<$(($($l)+)),*;$(($($g)+)),*>)? ($($w)*$w_item) $($rest)+
            );
        },
    }

    // Extract the name of the generic arg (type or const)
    macro zeroInit_arg_name {
        (const $N:ident $($_:tt)*) => {
            $N
        },
        ($T:ident $($_:tt)*) => {
            $T
        }
    }

    /// Use a generic arg (type or const) in a type
    macro zeroInit_arg_use {
        (const $N:ident $($_:tt)*) => {
            [(); $N]
        },
        ($T:ident $($_:tt)*) => {
            $T
        },
    }
}

// endregion
