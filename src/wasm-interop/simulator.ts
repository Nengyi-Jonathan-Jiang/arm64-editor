import module from '@simulator';

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
}

export namespace Simulator {
    module.allocSimulator(module.simulatorPtr);

    console.log(module, module.memory);
    (window as any)['module'] = module;
    console.log(new Uint32Array(
        module.memory.buffer.slice(
            module.simulatorPtr,
            module.simulatorPtr + 1024,
        ),
    ));

    type RegisterName = string | number;

    export function simulatorStep () {
        throw new Error("TODO");
    }

    export function simulatorRegisters (): Map<RegisterName, DataView>[] {
        throw new Error("TODO");
    }

    export function simulatorBranchPredictorTable (): Map<number, DataView> {
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