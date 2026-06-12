// noinspection JSUnusedGlobalSymbols

export const module : {    
    readonly memory: WebAssembly.Memory;
    
    /**
     * - WASM type: `int`
     * - Rust name: `PANIC_MSG`
     * - Rust type: `u8[1024]`
     */
    readonly panicBuffer: number;
    
    /**
     * - WASM type: `int`
     * - Rust name: `VOLATILE_PARAMS`
     * - Rust type: {@link SimulatorParams `SimulatorParams`}
     */
    readonly paramsPtr: number;
    
    /**
     * - WASM type: `int`
     */
    readonly heap_base: number;
    
    /**
     * - WASM type: `int`
     * - Rust name: `SIMULATOR`
     * - Rust type: {@link Mutex_Option_Simulator `Mutex<Option<Simulator>>`}
     */
    readonly simulatorPtr: number;
    
    /**
     * - WASM type: `int`
     * - Rust name: `PANIC_MSG_BUFFER_LEN`
     * - Rust type: `usize`
     */
    readonly panicBufferLen: number;
    
    /**
     * - WASM type: `int`
     */
    readonly data_end: number;
    
    /**
     * - Rust return type: {@link Simulator `Simulator`}
     * - Rust name: `alloc_simulator`
     * @param a
     *      - Converted from RVO return value
     *      - WASM type: `int_ptr`
     *      - Rust type: {@link Simulator `&mut Simulator`}
     */
    allocSimulator(a: number): void;
    
    /**
     * - Rust name: `clear_panic_message`
     */
    clearPanicBuffer(): void;
    
    /**
     * - Rust name: `update_simulator_params`
     */
    updateParams(): void;
}

export namespace types {    
    /**
     * - Name: `Predictor0`
     * - Size: `12`
     * 
     * Fields:
     * | Name   | @   | Type                                                  |
     * | ------ | --- | ----------------------------------------------------- |
     * | `base` | `0` | {@link BranchPredictorBase `BranchPredictorBase<()>`} |
     */
    type Predictor0 = any;
    
    /**
     * - Name: `BranchPredictorBase<()>`
     * - Size: `12`
     * 
     * Fields:
     * | Name          | @   | Type                                                         |
     * | ------------- | --- | ------------------------------------------------------------ |
     * | `bht`         | `0` | {@link UnsafeMutRef_BhtEntry `UnsafeMutRef<[BhtEntry<()>]>`} |
     * | `static_mode` | `8` | `StaticBranchPredictionMode`                                 |
     */
    type BranchPredictorBase = any;
    
    /**
     * - Name: `BhtEntry<()>`
     * - Size: `8`
     * 
     * Fields:
     * | Name                   | @   | Type  |
     * | ---------------------- | --- | ----- |
     * | `last_indirect_target` | `0` | `u64` |
     * | `data`                 | `8` | `()`  |
     */
    type BhtEntry = any;
    
    /**
     * - Name: `Predictor2`
     * - Size: `12`
     * 
     * Fields:
     * | Name   | @   | Type                                                     |
     * | ------ | --- | -------------------------------------------------------- |
     * | `base` | `0` | {@link BranchPredictorBase_u8 `BranchPredictorBase<u8>`} |
     */
    type Predictor2 = any;
    
    /**
     * - Name: `BranchPredictorBase<u8>`
     * - Size: `12`
     * 
     * Fields:
     * | Name          | @   | Type                                                            |
     * | ------------- | --- | --------------------------------------------------------------- |
     * | `bht`         | `0` | {@link UnsafeMutRef_BhtEntry_u8 `UnsafeMutRef<[BhtEntry<u8>]>`} |
     * | `static_mode` | `8` | `StaticBranchPredictionMode`                                    |
     */
    type BranchPredictorBase_u8 = any;
    
    /**
     * - Name: `BhtEntry<u8>`
     * - Size: `16`
     * 
     * Fields:
     * | Name                   | @   | Type  |
     * | ---------------------- | --- | ----- |
     * | `last_indirect_target` | `0` | `u64` |
     * | `data`                 | `8` | `u8`  |
     */
    type BhtEntry_u8 = any;
    
    /**
     * - Name: `Predictor1`
     * - Size: `12`
     * 
     * Fields:
     * | Name   | @   | Type                                                         |
     * | ------ | --- | ------------------------------------------------------------ |
     * | `base` | `0` | {@link BranchPredictorBase_bool `BranchPredictorBase<bool>`} |
     */
    type Predictor1 = any;
    
    /**
     * - Name: `BranchPredictorBase<bool>`
     * - Size: `12`
     * 
     * Fields:
     * | Name          | @   | Type                                                                |
     * | ------------- | --- | ------------------------------------------------------------------- |
     * | `bht`         | `0` | {@link UnsafeMutRef_BhtEntry_bool `UnsafeMutRef<[BhtEntry<bool>]>`} |
     * | `static_mode` | `8` | `StaticBranchPredictionMode`                                        |
     */
    type BranchPredictorBase_bool = any;
    
    /**
     * - Name: `BhtEntry<bool>`
     * - Size: `16`
     * 
     * Fields:
     * | Name                   | @   | Type   |
     * | ---------------------- | --- | ------ |
     * | `last_indirect_target` | `0` | `u64`  |
     * | `data`                 | `8` | `bool` |
     */
    type BhtEntry_bool = any;
    
    /**
     * - Name: `DummyCache`
     * - Size: `0`
     */
    type DummyCache = any;
    
    /**
     * - Name: `DummyPipeline`
     * - Size: `0`
     */
    type DummyPipeline = any;
    
    /**
     * - Name: `Simulator`
     * - Size: `288`
     * 
     * Fields:
     * | Name               | @     | Type                                                                         |
     * | ------------------ | ----- | ---------------------------------------------------------------------------- |
     * | `pipeline`         | `0`   | {@link UnsafeMutRef_dyn_Pipeline `UnsafeMutRef<dyn Pipeline>`}               |
     * | `cache`            | `8`   | {@link UnsafeMutRef_dyn_Cache `UnsafeMutRef<dyn Cache>`}                     |
     * | `branch_predictor` | `16`  | {@link UnsafeMutRef_dyn_BranchPredictor `UnsafeMutRef<dyn BranchPredictor>`} |
     * | `registers`        | `24`  | `u64[32]`                                                                    |
     * | `memory`           | `280` | {@link Memory `Memory`}                                                      |
     */
    type Simulator = any;
    
    /**
     * - Name: `Memory`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                         |
     * | ----- | --- | -------------------------------------------- |
     * | `mem` | `0` | {@link UnsafeMutRef_u8 `UnsafeMutRef<[u8]>`} |
     */
    type Memory = any;
    
    /**
     * - Name: `SimulatorParams`
     * - Size: `11`
     * 
     * Fields:
     * | Name                | @   | Type                                                  |
     * | ------------------- | --- | ----------------------------------------------------- |
     * | `cache_params`      | `0` | {@link CacheParams `CacheParams`}                     |
     * | `pipeline_params`   | `5` | {@link PipelineParams `PipelineParams`}               |
     * | `branch_prediction` | `8` | {@link BranchPredictorParams `BranchPredictorParams`} |
     */
    type SimulatorParams = any;
    
    /**
     * - Name: `CacheParams`
     * - Size: `5`
     * 
     * Fields:
     * | Name             | @   | Type             |
     * | ---------------- | --- | ---------------- |
     * | `associativity`  | `0` | `u8`             |
     * | `block_size_log` | `1` | `u8`             |
     * | `num_sets_log`   | `2` | `u8`             |
     * | `policy`         | `3` | `CachePolicy`    |
     * | `write_mode`     | `4` | `CacheWriteMode` |
     */
    type CacheParams = any;
    
    /**
     * - Name: `PipelineParams`
     * - Size: `3`
     * 
     * Fields:
     * | Name            | @   | Type                                      |
     * | --------------- | --- | ----------------------------------------- |
     * | `pipeline_mode` | `0` | `PipelineMode`                            |
     * | `cycle_times`   | `1` | {@link CycleTimeParams `CycleTimeParams`} |
     */
    type PipelineParams = any;
    
    /**
     * - Name: `CycleTimeParams`
     * - Size: `2`
     * 
     * Fields:
     * | Name           | @   | Type |
     * | -------------- | --- | ---- |
     * | `cache_access` | `0` | `u8` |
     * | `dram_penalty` | `1` | `u8` |
     */
    type CycleTimeParams = any;
    
    /**
     * - Name: `BranchPredictorParams`
     * - Size: `3`
     * 
     * Fields:
     * | Name                | @   | Type                         |
     * | ------------------- | --- | ---------------------------- |
     * | `bht_size_log`      | `0` | `u8`                         |
     * | `dynamic_predictor` | `1` | `DynamicBranchPredictor`     |
     * | `static_mode`       | `2` | `StaticBranchPredictionMode` |
     */
    type BranchPredictorParams = any;
    
    /**
     * - Name: `UnsafeMutRef<[BhtEntry<()>]>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                           |
     * | ----- | --- | ---------------------------------------------- |
     * | `ptr` | `0` | {@link ptr_mut_BhtEntry `*mut [BhtEntry<()>]`} |
     */
    type UnsafeMutRef_BhtEntry = any;
    
    /**
     * - Name: `UnsafeMutRef<[BhtEntry<u8>]>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                              |
     * | ----- | --- | ------------------------------------------------- |
     * | `ptr` | `0` | {@link ptr_mut_BhtEntry_u8 `*mut [BhtEntry<u8>]`} |
     */
    type UnsafeMutRef_BhtEntry_u8 = any;
    
    /**
     * - Name: `UnsafeMutRef<[BhtEntry<bool>]>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                                  |
     * | ----- | --- | ----------------------------------------------------- |
     * | `ptr` | `0` | {@link ptr_mut_BhtEntry_bool `*mut [BhtEntry<bool>]`} |
     */
    type UnsafeMutRef_BhtEntry_bool = any;
    
    /**
     * - Name: `UnsafeMutRef<dyn Pipeline>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                             |
     * | ----- | --- | ------------------------------------------------ |
     * | `ptr` | `0` | {@link ptr_mut_dyn_Pipeline `*mut dyn Pipeline`} |
     */
    type UnsafeMutRef_dyn_Pipeline = any;
    
    /**
     * - Name: `UnsafeMutRef<dyn Cache>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                       |
     * | ----- | --- | ------------------------------------------ |
     * | `ptr` | `0` | {@link ptr_mut_dyn_Cache `*mut dyn Cache`} |
     */
    type UnsafeMutRef_dyn_Cache = any;
    
    /**
     * - Name: `UnsafeMutRef<dyn BranchPredictor>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                                           |
     * | ----- | --- | -------------------------------------------------------------- |
     * | `ptr` | `0` | {@link ptr_mut_dyn_BranchPredictor `*mut dyn BranchPredictor`} |
     */
    type UnsafeMutRef_dyn_BranchPredictor = any;
    
    /**
     * - Name: `UnsafeMutRef<[u8]>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                           |
     * | ----- | --- | ------------------------------ |
     * | `ptr` | `0` | {@link ptr_mut_u8 `*mut [u8]`} |
     */
    type UnsafeMutRef_u8 = any;
    
    /**
     * - Name: `Mutex<Option<Simulator>>`
     * - Size: `296`
     * 
     * Fields:
     * | Name     | @     | Type                                                                |
     * | -------- | ----- | ------------------------------------------------------------------- |
     * | `data`   | `0`   | {@link UnsafeCell_Option_Simulator `UnsafeCell<Option<Simulator>>`} |
     * | `locked` | `288` | {@link UnsafeCell_bool `UnsafeCell<bool>`}                          |
     */
    type Mutex_Option_Simulator = any;
    
    /**
     * - Name: `*mut [BhtEntry<()>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                              |
     * | ---------- | --- | --------------------------------- |
     * | `data_ptr` | `0` | {@link BhtEntry `BhtEntry<()> *`} |
     * | `length`   | `4` | `usize`                           |
     */
    type ptr_mut_BhtEntry = any;
    
    /**
     * - Name: `*mut [BhtEntry<u8>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                                 |
     * | ---------- | --- | ------------------------------------ |
     * | `data_ptr` | `0` | {@link BhtEntry_u8 `BhtEntry<u8> *`} |
     * | `length`   | `4` | `usize`                              |
     */
    type ptr_mut_BhtEntry_u8 = any;
    
    /**
     * - Name: `*mut [BhtEntry<bool>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                                     |
     * | ---------- | --- | ---------------------------------------- |
     * | `data_ptr` | `0` | {@link BhtEntry_bool `BhtEntry<bool> *`} |
     * | `length`   | `4` | `usize`                                  |
     */
    type ptr_mut_BhtEntry_bool = any;
    
    /**
     * - Name: `UnsafeCell<bool>`
     * - Size: `1`
     * 
     * Fields:
     * | Name    | @   | Type   |
     * | ------- | --- | ------ |
     * | `value` | `0` | `bool` |
     */
    type UnsafeCell_bool = any;
    
    /**
     * - Name: `UnsafeCell<Option<Simulator>>`
     * - Size: `288`
     * 
     * Fields:
     * | Name    | @   | Type                |
     * | ------- | --- | ------------------- |
     * | `value` | `0` | `Option<Simulator>` |
     */
    type UnsafeCell_Option_Simulator = any;
    
    /**
     * - Name: `dyn Pipeline`
     * - Size: `0`
     * 
     * Implementations: {@link DummyPipeline `DummyPipeline`}
     */
    type dyn_Pipeline = any;
    
    /**
     * - Name: `*mut dyn Pipeline`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                                  |
     * | --------- | --- | ------------------------------------- |
     * | `pointer` | `0` | {@link dyn_Pipeline `dyn Pipeline *`} |
     * | `vtable`  | `4` | `usize (*)[5]`                        |
     */
    type ptr_mut_dyn_Pipeline = any;
    
    /**
     * - Name: `dyn Cache`
     * - Size: `0`
     * 
     * Implementations: {@link DummyCache `DummyCache`}
     */
    type dyn_Cache = any;
    
    /**
     * - Name: `*mut dyn Cache`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                            |
     * | --------- | --- | ------------------------------- |
     * | `pointer` | `0` | {@link dyn_Cache `dyn Cache *`} |
     * | `vtable`  | `4` | `usize (*)[5]`                  |
     */
    type ptr_mut_dyn_Cache = any;
    
    /**
     * - Name: `dyn BranchPredictor`
     * - Size: `0`
     * 
     * Implementations: {@link Predictor0 `Predictor0`}, {@link Predictor2 `Predictor2`}, {@link Predictor1 `Predictor1`}
     */
    type dyn_BranchPredictor = any;
    
    /**
     * - Name: `*mut dyn BranchPredictor`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                                                |
     * | --------- | --- | --------------------------------------------------- |
     * | `pointer` | `0` | {@link dyn_BranchPredictor `dyn BranchPredictor *`} |
     * | `vtable`  | `4` | `usize (*)[7]`                                      |
     */
    type ptr_mut_dyn_BranchPredictor = any;
    
    /**
     * - Name: `*mut [u8]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type    |
     * | ---------- | --- | ------- |
     * | `data_ptr` | `0` | `u8 *`  |
     * | `length`   | `4` | `usize` |
     */
    type ptr_mut_u8 = any;
}

export default module;