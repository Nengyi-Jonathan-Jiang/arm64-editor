use crate::components::sizes::{Addr, Byte};
use crate::components::{Cache, Memory};
use crate::unsafe_ref::UnsafeMutRef;

pub struct DummyCache {}

impl DummyCache {
    pub fn new() -> UnsafeMutRef<dyn Cache> {
        unsafe { UnsafeMutRef::new_from_ptr(0 as *mut Self).map_into(|x| x as _) }
    }
}

impl Cache for DummyCache {
    fn read(&mut self, _: &Memory, _: Addr) -> Result<Byte, ()> {
        Ok(0)
    }

    fn write(&mut self, _: &mut Memory, _: Addr, _: Byte) -> Result<(), ()> {
        Ok(())
    }
}
