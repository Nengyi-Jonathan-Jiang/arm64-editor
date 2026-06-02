use crate::js_interop::params::SimulatorParams;
use core::mem::MaybeUninit;

#[unsafe(export_name = "params_ptr")]
static mut PARAMS_VOLATILE: MaybeUninit<SimulatorParams> = MaybeUninit::uninit();

#[unsafe(export_name = "initSimulator")]
unsafe fn init_simulator() {
    let SimulatorParams {
        cache_params,
        pipeline_params,
        cycle_times,
        branch_prediction,
    } = unsafe {
        {
            #[allow(static_mut_refs)]
            PARAMS_VOLATILE.as_ptr()
        }
        .read_volatile()
    };

    // let branch_predictor = match branch_prediction.dynamic_predictor {
    //     DynamicBranchPredictor::None => Predictor1 {},
    //     DynamicBranchPredictor::OneBitSaturating => {}
    //     DynamicBranchPredictor::TwoBitSaturating => {}
    // };
    // TODO: initialize simulator
}
