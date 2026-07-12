/// Check [`TransmuteAssertions`] such as [`SIZE`](TransmuteAssertions::SIZE) and
/// [`ALIGN`](TransmuteAssertions::ALIGN).
///
/// Usage:
/// ```compile_fail
/// # use crate::simulator::transmute_assertions::check_transmute;
///
/// // Success
/// check_transmute!([u8; 2] as u16: SIZE);
/// // Success
/// check_transmute!(u16 as [u8; 2]: SIZE, ALIGN);
/// // Equivalent to above
/// check_transmute!(u16 as [u8; 2]);
/// // Fail, u16 is more aligned than [u8; 2]
/// check_transmute!([u8; 2] as u16: ALIGN);
/// ```
pub macro check_transmute{
    ($from:ty as $to:ty : $assertion:ident, $($rest:ident),+) => {
        check_transmute!($from as $to : $assertion);
        check_transmute!($from as $to : $($rest),+);
    },
    ($from:ty as $to:ty : $assertion:ident) => {
        const { check_transmute!(@ $from as $to : $assertion); }
    },
    (@ $from:ty as $to:ty : SIZE) => {
        let from_size: usize = core::mem::size_of::<$from>();
        let to_size: usize = core::mem::size_of::<$to>();

        assert!(from_size == to_size, "transmute size requirement violation");
    },
    (@ $from:ty as $to:ty : ALIGN) => {
        let from_align: usize = core::mem::align_of::<$from>();
        let to_align: usize = core::mem::align_of::<$to>();

        assert!(from_align >= to_align, "transmute alignment requirement violation");
    },

    (@ $assertion:ident) => {
        compile_error!("Unknown static check transmute");
    },

    ($from:ty as $to:ty) => {
         check_transmute!($from as $to : SIZE, ALIGN);
    }
}