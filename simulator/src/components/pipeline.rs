use crate::components::Pipeline;
use crate::unsafe_ref::UnsafeMutRef;

pub struct DummyPipeline {}

impl DummyPipeline {
    pub fn new() -> UnsafeMutRef<dyn Pipeline> {
        unsafe { UnsafeMutRef::new_from_ptr(0 as *mut Self).map_into(|x| x as _) }
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
