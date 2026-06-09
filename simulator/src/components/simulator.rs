use crate::components::{BranchPredictor, Cache, Memory, Pipeline, Simulator};
use crate::unsafe_ref::UnsafeMutRef;

impl Simulator {
    pub fn new(
        pipeline: UnsafeMutRef<dyn Pipeline>,
        cache: UnsafeMutRef<dyn Cache>,
        branch_predictor: UnsafeMutRef<dyn BranchPredictor>,
        memory: Memory,
    ) -> Self {
        Self {
            pipeline,
            cache,
            branch_predictor,

            registers: [0; 32],

            memory,
        }
    }
}
