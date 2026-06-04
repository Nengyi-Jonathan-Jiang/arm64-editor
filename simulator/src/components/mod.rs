pub mod branch_predictor;

pub mod sizes {
    pub type Byte = u8;
    
    pub type Word = u64;
    pub type HWord = u32;

    pub type Addr = Word;
    pub type Instruction = u32;
    pub static INSTRUCTION_SIZE_BYTES: usize = 4;
}

use core::marker::PhantomPinned;
use sizes::*;


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
    pub pipeline: &'a mut dyn Pipeline,
    pub cache: &'a mut dyn Cache,
    pub branch_predictor: &'a mut dyn BranchPredictor,

    pub registers: [u64; 32],

    pub memory: Memory<'a>,

    _pin: PhantomPinned,
}

impl Simulator<'_> {}



pub struct Memory<'a> {
    mem: &'a mut [Byte],
}

pub trait Pipeline {
    /// Flush the pipeline
    fn flush(&mut self);

    fn step(&mut self);
}

pub trait Cache {}

struct SimpleCache {}

pub trait BranchPredictor {
    fn predict(&self, addr: Addr, target_addr: Addr) -> bool;
    fn predict_indirect(&self, addr: Addr) -> (bool, Addr);

    fn update(&mut self, addr: Addr);
    fn update_indirect(&mut self, addr: Addr, actual_target_addr: Addr);
}
