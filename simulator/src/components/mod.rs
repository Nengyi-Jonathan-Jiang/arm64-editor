pub mod branch_predictor;
pub mod cache;
pub mod pipeline;

mod simulator;
mod sizes;

use crate::unsafe_ref::UnsafeMutRef;

use sizes::*;

#[repr(C)]
pub struct Simulator {
    pub pipeline: UnsafeMutRef<dyn Pipeline>,
    pub cache: UnsafeMutRef<dyn Cache>,
    pub branch_predictor: UnsafeMutRef<dyn BranchPredictor>,

    pub registers: [u64; 32],

    pub memory: Memory,
}

pub struct Memory {
    pub mem: UnsafeMutRef<[Byte]>,
}

pub trait Pipeline {
    /// Flush the pipeline
    fn flush(&mut self);
    fn step(&mut self);
}

pub trait Cache {
    fn read(&mut self, mem: &Memory, addr: Addr) -> Result<Byte, ()>;
    fn write(&mut self, mem: &mut Memory, addr: Addr, value: Byte) -> Result<(), ()>;
}

pub trait BranchPredictor {
    fn predict(&self, addr: Addr, target_addr: Addr) -> bool;
    fn predict_indirect(&self, addr: Addr) -> (bool, Addr);

    fn update(&mut self, addr: Addr, did_jump: bool);
    fn update_indirect(&mut self, addr: Addr, did_jump: bool, actual_target_addr: Addr);
}
