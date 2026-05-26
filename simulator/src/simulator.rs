// use alloc::boxed::Box;
use core::marker::PhantomPinned;

/*
At runtime, we should have the following layout

<static stuff>
Simulator { (statically sized)
    ptr to pipeline
    ptr to cache
    ptr to branch predictor
    ptr to memory

    other vars
}
dyn Pipeline
dyn Cache
dyn BranchPredictor

Memory (grows unboundedly)
 */

#[repr(C)]
pub struct Simulator<'a> {
    pipeline: &'a mut dyn Pipeline,
    cache: &'a mut dyn Cache,
    branch_predictor: &'a mut dyn BranchPredictor,

    registers: [u64; 32],

    _pin: PhantomPinned,
}

impl Simulator<'_> {
}

pub struct Memory<'a> {
    mem: &'a mut [u8],
}

pub trait Pipeline {
    /// Flush the pipeline
    fn flush(&mut self);

    fn step(&mut self);
}

pub trait Cache {

}

struct SimpleCache {

}

pub trait BranchPredictor {

}