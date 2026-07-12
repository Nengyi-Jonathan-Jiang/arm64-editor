use crate::Allocation;
use crate::components::sizes::{Addr, Byte};
use crate::components::{MemoryAccess};

pub struct DummyMemoryAccess {}

impl DummyMemoryAccess {
    pub fn new() -> Allocation<dyn MemoryAccess> {
        todo!()
    }
}

impl MemoryAccess for DummyMemoryAccess {
    fn get(&mut self, addr: Addr) -> Result<&mut u8, ()> {
        Err(())
    }

    fn read_b(&mut self, _: Addr) -> Result<Byte, ()> {
        Ok(0)
    }

    fn write_b(&mut self, _: Addr, _: Byte) -> Result<(), ()> {
        Ok(())
    }
}
