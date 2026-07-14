use crate::alloc_interface::{IAlloc, IAllocation};
use crate::components::Pipeline;
use crate::zero_init::zeroInit;
use crate::{Alloc, Allocation};
use macro_rules_attribute::derive;

#[derive(Default, zeroInit!)]
pub struct DummyPipeline {}

impl DummyPipeline {
    pub fn new() -> Allocation<dyn Pipeline> {
        unsafe {
            Alloc::alloc::<DummyPipeline>()
                .init_zeroed()
                .unsized_map(|x| x as &mut dyn Pipeline)
        }
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
