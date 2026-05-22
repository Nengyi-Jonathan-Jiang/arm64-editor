import init, * as simulatorStuff from '@simulator';

const module: Omit<typeof simulatorStuff, 'initSync' | 'default'> & {
    memory: WebAssembly.Memory
} = await init();

// let {
//         simulatorRegistersPtr,
//         simulatorMemoryPtr,
//         simulatorPipelineStagesPtr,
//         simulatorCachePtr,
//     } = module.init(Simulator.getDefaultSimulatorParams());
export const paramsPtr = module.get_params_ptr();
console.log(module.memory, paramsPtr)

export namespace Simulator {
    export enum CachePolicy {
        LRU  = 0,
        NMRU = 1
    }

    export enum CacheWriteMode {
        WriteBack    = 0,
        WriteThrough = 1
    }

    export enum PipelineMode {
        None       = 0,
        ThreeStage = 1,
        FiveStage  = 2,
    }

    export enum StaticBranchPredictionMode {
        Always      = 0,
        Never       = 1,
        Directional = 2
    }

    export enum DynamicBranchPredictor {
        OneBitSaturating = 1,
        TwoBitSaturating = 2,
    }

    export type SimulatorParams = {
        cacheParams: {
            associativity: 1 | 2 | 4 | 8;
            blockSize: number;
            numSets: number;
            policy: CachePolicy;
            writeMode: CacheWriteMode;
        },
        pipelineParams: {
            pipelineMode: PipelineMode;
        }
        cycleTimes: {
            cache: number;
            DRAMPenalty: number;
            // TODO: add more
        },
        branchPrediction: {
            dynamicEnabled: boolean;
            dynamicBHTSize: number;
            dynamicPredictor: DynamicBranchPredictor;
            staticMode: StaticBranchPredictionMode;
        }
    };

    export function simulatorStep () {
        throw new Error("TODO");
    }

    export function simulatorRawRegisterBytes (): DataView {
        throw new Error("TODO");
    }


    export function getDefaultSimulatorParams (): SimulatorParams {
        return {
            cacheParams:      { // No memory caching
                associativity: 1,
                blockSize:     1,
                numSets:       1,
                policy:        CachePolicy.LRU,
                writeMode:     CacheWriteMode.WriteBack,
            },
            pipelineParams:   { // No pipelining
                pipelineMode: PipelineMode.None,
            },
            cycleTimes:       { // These should be reasonable afaik
                cache:       1,
                DRAMPenalty: 8,
            },
            branchPrediction: { // No branch prediction
                dynamicEnabled:   false,
                dynamicBHTSize:   0,
                dynamicPredictor: DynamicBranchPredictor.OneBitSaturating,
                staticMode:       StaticBranchPredictionMode.Always,
            },
        };
    }

    export function resetWithParameters (_params: SimulatorParams) {

    }
}