pub mod branch_predictor;
pub mod mem_access;
pub mod pipeline;

mod simulator;
mod sizes;
mod lru_cache;

use crate::unsafe_ref::UnsafeMutRef;

use sizes::*;

#[repr(C)]
pub struct Simulator {
    pub pipeline: UnsafeMutRef<dyn Pipeline>,
    pub cache: UnsafeMutRef<dyn MemoryAccess>,
    pub branch_predictor: UnsafeMutRef<dyn BranchPredictor>,

    pub registers: [u64; 128], // Plenty of space for general purpose and FP/SIMD registers
}

pub trait Pipeline {
    /// Flush the pipeline
    fn flush(&mut self);
    fn step(&mut self);
}

pub trait MemoryAccess {
    fn read(&mut self, addr: Addr) -> Result<Byte, ()>;
    fn write(&mut self, addr: Addr, value: Byte) -> Result<(), ()>;


}

pub trait BranchPredictor {
    fn predict(&self, addr: Addr, target_addr: Addr) -> bool;
    fn predict_indirect(&self, addr: Addr) -> (bool, Addr);

    fn update(&mut self, addr: Addr, did_jump: bool);
    fn update_indirect(&mut self, addr: Addr, did_jump: bool, actual_target_addr: Addr);
}
