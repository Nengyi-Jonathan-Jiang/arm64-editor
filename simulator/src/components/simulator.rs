use crate::components::{BranchPredictor, MemoryAccess, Pipeline, Simulator};
use crate::Allocation;

impl Simulator {
    pub fn new(
        pipeline: Allocation<dyn Pipeline>,
        cache: Allocation<dyn MemoryAccess>,
        branch_predictor: Allocation<dyn BranchPredictor>
    ) -> Self {
        Self {
            pipeline,
            cache,
            branch_predictor,

            registers: [0; 128]
        }
    }
}
