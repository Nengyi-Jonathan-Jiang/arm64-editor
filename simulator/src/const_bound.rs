/// A type whose existence enforces a (possibly chained) inequality.
///
/// Example usage:
/// ```
/// struct Foo<const N: usize>
/// where const_bound!(0 <= N):
/// { ... }
///
/// struct Bar<const A: usize, const B: usize>
/// where const_bound!(A <= B < (A * 2)):
/// { ... }
///
/// struct Baz<const A: usize, const B: usize>
/// where const_bound!(A < B ; 4 <= B):
/// { ... }
/// ```
///
/// Internally this expands to a (possible nested tuple of) array types whose length enforces the
/// inequalities by being required by the compiler to be nonnegative.
///
/// Unfortunately, ths Rust compiler is not yet smart enough to always infer logical relationships
/// between the existence of two types that are not syntactically identical. Thus, it may still be
/// required to exactly repeat dependencies' const_bounds! even when it seems to be mathematically
/// correct to omit them.
macro_rules! const_bound {
    // A < B iff 0 <= B - A - 1
    ($A:tt <  $B:tt) => { [(); ($B) - (($A) + 1)] };
    // A <= B iff 0 <= B - A
    ($A:tt <= $B:tt) => { [(); ($B) - ($A)] };
    // Imposes no relation
    ($A:tt ;  $B:tt) => { () };
    ($A: tt $op:tt $B: tt $($op2:tt $C: tt)+) => {
        (
            const_bound!($A $op $B),
            const_bound!($B $($op2 $C)+)
        )
    };
}

pub(crate) use const_bound;