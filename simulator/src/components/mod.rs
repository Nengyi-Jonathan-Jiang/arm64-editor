pub mod branch_predictor;
pub mod mem_access;
pub mod pipeline;

mod lru_cache;
mod simulator;
mod sizes;

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
    fn get(&mut self, addr: Addr) -> Result<&mut u8, ()>;

    fn read_b(&mut self, addr: Addr) -> Result<Byte, ()> {
        Ok(*self.get(addr)?)
    }

    fn write_b(&mut self, addr: Addr, value: Byte) -> Result<(), ()> {
        *self.get(addr)? = value;
        Ok(())
    }

    fn read_h(&mut self, addr: Addr) -> Result<HWord, ()> {
        Ok(HWord::from_le_bytes([
            self.read_b(addr + 0)?,
            self.read_b(addr + 1)?,
        ]))
    }

    fn write_h(&mut self, addr: Addr, value: HWord) -> Result<(), ()> {
        let bytes = value.to_le_bytes();
        self.write_b(addr + 0, bytes[0])?;
        self.write_b(addr + 1, bytes[1])?;
        Ok(())
    }

    fn read(&mut self, addr: Addr) -> Result<Word, ()> {
        Ok(Word::from_le_bytes([
            self.read_b(addr + 0)?,
            self.read_b(addr + 1)?,
            self.read_b(addr + 2)?,
            self.read_b(addr + 3)?,
        ]))
    }

    fn write(&mut self, addr: Addr, value: Word) -> Result<(), ()> {
        let bytes = value.to_le_bytes();
        self.write_b(addr + 0, bytes[0])?;
        self.write_b(addr + 1, bytes[1])?;
        self.write_b(addr + 2, bytes[2])?;
        self.write_b(addr + 3, bytes[3])?;
        Ok(())
    }

    fn read_x(&mut self, addr: Addr) -> Result<XWord, ()> {
        Ok(XWord::from_le_bytes([
            self.read_b(addr + 0)?,
            self.read_b(addr + 1)?,
            self.read_b(addr + 2)?,
            self.read_b(addr + 3)?,
            self.read_b(addr + 4)?,
            self.read_b(addr + 5)?,
            self.read_b(addr + 6)?,
            self.read_b(addr + 7)?,
        ]))
    }

    fn write_x(&mut self, addr: Addr, value: XWord) -> Result<(), ()> {
        let bytes = value.to_le_bytes();
        self.write_b(addr + 0, bytes[0])?;
        self.write_b(addr + 1, bytes[1])?;
        self.write_b(addr + 2, bytes[2])?;
        self.write_b(addr + 3, bytes[3])?;
        self.write_b(addr + 4, bytes[4])?;
        self.write_b(addr + 5, bytes[5])?;
        self.write_b(addr + 6, bytes[6])?;
        self.write_b(addr + 7, bytes[7])?;

        Ok(())
    }
}

pub trait BranchPredictor {
    // Predict whether an instruction is a branch that will be taken, and the target address of the
    // branch
    fn predict(&self, addr: Addr) -> Option<Addr>;

    // Update the target of the branch instruction.
    fn update_target(&mut self, addr: Addr, target_addr: Addr);
    // Update whether the branch was taken or not
    fn update_branch(&mut self, addr: Addr, did_jump: bool);
}
