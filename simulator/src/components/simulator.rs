use crate::components::{BranchPredictor, MemoryAccess, Pipeline, Simulator};
use crate::unsafe_ref::UnsafeMutRef;

impl Simulator {
    pub fn new(
        pipeline: UnsafeMutRef<dyn Pipeline>,
        cache: UnsafeMutRef<dyn MemoryAccess>,
        branch_predictor: UnsafeMutRef<dyn BranchPredictor>
    ) -> Self {
        Self {
            pipeline,
            cache,
            branch_predictor,

            registers: [0; 128]
        }
    }
}
