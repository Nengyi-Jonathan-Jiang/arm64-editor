use core::mem::MaybeUninit;

static mut PARAMS_VOLATILE: MaybeUninit<SimulatorParams> = MaybeUninit::uninit();

/// Used by Javascript-side code to set parameters
#[unsafe(export_name = "getParamsPtr")]
unsafe fn get_params_ptr() -> *const SimulatorParams {
    #[allow(static_mut_refs)]
    unsafe {
        PARAMS_VOLATILE.as_ptr()
    }
}

#[unsafe(export_name = "initSimulator")]
unsafe fn init_simulator() {
    let params = unsafe { get_params_ptr().read_volatile() };
    // TODO: initialize simulator
}

// Params type definition

#[repr(C, packed)]
#[derive(Copy, Clone)]
pub struct SimulatorParams {
    pub cache_params: CacheParams,
    pub pipeline_params: PipelineParams,
    pub cycle_times: CycleTimeParams,
    pub branch_prediction: BranchPredictionParams,
}

#[repr(C, packed)]
#[derive(Copy, Clone)]
pub struct CacheParams {
    pub associativity: u8,
    pub block_size_log: u8,
    pub num_sets_log: u8,

    pub policy: CachePolicy,
    pub write_mode: CacheWriteMode,
}

#[repr(C, packed)]
#[derive(Copy, Clone)]
pub struct PipelineParams {
    pub pipeline_mode: PipelineMode,
}

#[repr(C, packed)]
#[derive(Copy, Clone)]
pub struct CycleTimeParams {
    pub cache_access: u8,
    pub dram_penalty: u8,
}

#[repr(C, packed)]
#[derive(Copy, Clone)]
pub struct BranchPredictionParams {
    dynamic_enabled: bool,
    bht_size_log: u8,
    dynamic_predictor: DynamicBranchPredictor,
    static_mode: StaticBranchPredictionMode,
}

#[repr(u8)]
#[derive(Copy, Clone)]
pub enum CachePolicy {
    LRU = 0,
    NMRU = 1,
}

#[repr(u8)]
#[derive(Copy, Clone)]
pub enum CacheWriteMode {
    WriteBack = 0,
    WriteThrough = 1,
}

#[repr(u8)]
#[derive(Copy, Clone)]
pub enum PipelineMode {
    None = 0,
    ThreeStage = 1,
    FiveStage = 2,
}

#[repr(u8)]
#[derive(Copy, Clone)]
pub enum StaticBranchPredictionMode {
    Always = 0,
    Never = 1,
    Directional = 2,
}

#[repr(u8)]
#[derive(Copy, Clone)]
pub enum DynamicBranchPredictor {
    OneBitSaturating = 1,
    TwoBitSaturating = 2,
}
