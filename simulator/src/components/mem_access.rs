use crate::components::sizes::{Addr, Byte};
use crate::components::{MemoryAccess};
use crate::unsafe_ref::UnsafeMutRef;

pub struct DummyMemoryAccess {}

impl DummyMemoryAccess {
    pub fn new() -> UnsafeMutRef<dyn MemoryAccess> {
        unsafe { UnsafeMutRef::new_from_ptr(0 as *mut Self).map_into(|x| x as _) }
    }
}

impl MemoryAccess for DummyMemoryAccess {
    fn read(&mut self, _: Addr) -> Result<Byte, ()> {
        Ok(0)
    }

    fn write(&mut self, _: Addr, _: Byte) -> Result<(), ()> {
        Ok(())
    }
}
