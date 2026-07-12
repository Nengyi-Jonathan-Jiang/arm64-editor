use crate::alloc_interface::{IAlloc, IAllocation};
use crate::components::Pipeline;
use crate::zero_init::zeroInit;
use crate::{Alloc, Allocation};
use macro_rules_attribute::derive;

#[derive(Default, zeroInit!)]
pub struct DummyPipeline {}

impl DummyPipeline {
    pub fn new() -> Allocation<dyn Pipeline> {
        let x = Alloc::append_uninit::<DummyPipeline>().init_zeroed();
        type x = <<Alloc as IAlloc>::Allocation<u8> as IAllocation>::MapResult<u8>;
        todo!()
    }
}

impl Pipeline for DummyPipeline {
    fn flush(&mut self) {
        todo!()
    }

    fn step(&mut self) {
        todo!()
    }
}
