use crate::components::Pipeline;
use crate::unsafe_ref::UnsafeMutRef;

pub struct DummyPipeline {
    _x: X,
    _y: Y,
    _y2: Y2,
    _z: Z<Z2>,
}

struct X;
enum Y { A }
enum Y2 { A(Z<Y>) }
enum Z<T: 'static> { A, B(&'static T) }
enum Z2 { A, B(*const X) }

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
