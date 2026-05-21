use wasm_bindgen::prelude::wasm_bindgen;

// These values shouldn't matter as long as JS initializes them correctly
static mut PARAMS: SimulatorParams = SimulatorParams {
    cache_params: CacheParams {
        associativity: 1,
        block_size_log: 0,
        num_sets_log: 0,
        policy: CachePolicy::LRU,
        write_mode: CacheWriteMode::WriteBack,
    },
    pipeline_params: PipelineParams {
        pipeline_mode: PipelineMode::None,
    },
    cycle_times: CycleTimeParams {
        cache_access: 1,
        dram_penalty: 8,
    },
    branch_prediction: BranchPredictionParams {
        dynamic_enabled: false,
        bht_size_log: 0,
        dynamic_predictor: DynamicBranchPredictor::OneBitSaturating,
        static_mode: StaticBranchPredictionMode::Always,
    },
};

#[wasm_bindgen]
pub unsafe fn get_params_ptr() -> *const SimulatorParams {
    &PARAMS
}

pub fn get_params() -> &'static SimulatorParams {
    unsafe { &PARAMS }
}

#[repr(C, packed)]
pub struct SimulatorParams {
    pub cache_params: CacheParams,
    pub pipeline_params: PipelineParams,
    pub cycle_times: CycleTimeParams,
    pub branch_prediction: BranchPredictionParams,
}

#[repr(C, packed)]
pub struct CacheParams {
    pub associativity: u8,
    pub block_size_log: u8,
    pub num_sets_log: u8,

    pub policy: CachePolicy,
    pub write_mode: CacheWriteMode,
}

#[repr(C, packed)]
pub struct PipelineParams {
    pub pipeline_mode: PipelineMode,
}

#[repr(C, packed)]
pub struct CycleTimeParams {
    pub cache_access: u8,
    pub dram_penalty: u8,
}

#[repr(C, packed)]
pub struct BranchPredictionParams {
    dynamic_enabled: bool,
    bht_size_log: u8,
    dynamic_predictor: DynamicBranchPredictor,
    static_mode: StaticBranchPredictionMode,
}

#[repr(u8)]
pub enum CachePolicy {
    LRU = 0,
    NMRU = 1,
}

#[repr(u8)]
pub enum CacheWriteMode {
    WriteBack = 0,
    WriteThrough = 1,
}

#[repr(u8)]
pub enum PipelineMode {
    None = 0,
    ThreeStage = 1,
    FiveStage = 2,
}

#[repr(u8)]
pub enum StaticBranchPredictionMode {
    Always = 0,
    Never = 1,
    Directional = 2,
}

#[repr(u8)]
pub enum DynamicBranchPredictor {
    OneBitSaturating = 1,
    TwoBitSaturating = 2,
}
