// noinspection JSUnusedGlobalSymbols

export const module : {    
    readonly memory: WebAssembly.Memory;
    
    /**
     * - WASM type: `int`
     * - Rust name: `simulator::_::PANIC_MSG`
     * - Rust type: `[u8 ; 1024]`
     */
    readonly panicBuffer: number;
    
    /**
     * - WASM type: `int`
     * - Rust name: `simulator::wasm::globals::VOLATILE_PARAMS`
     * - Rust type: {@link SimulatorParams `SimulatorParams`}
     */
    readonly paramsPtr: number;
    
    /**
     * - WASM type: `int`
     * - Rust name: `simulator::wasm::globals::SIMULATOR`
     * - Rust type: {@link Mutex_Option_Simulator `Mutex<Option<Simulator>>`}
     */
    readonly simulatorPtr: number;
    
    /**
     * - WASM type: `int`
     * - Rust name: `simulator::_::PANIC_MSG_BUFFER_LEN`
     * - Rust type: `usize`
     */
    readonly panicBufferLen: number;
    
    /**
     * - Rust return type: {@link Simulator `Simulator`}
     * - Rust name: `simulator::wasm::globals::alloc_simulator`
     * @param a
     *      - Converted from RVO return value
     *      - WASM type: `{ a:int, b:int, c:int, d:int, e:int, f:int }`
     *      - Rust type: {@link Simulator `&mut Simulator`}
     */
    allocSimulator(a: number): void;
    
    /**
     * - Rust return type: `()`
     * - Rust name: `simulator::_::clear_panic_message`
     */
    clearPanicBuffer(): void;
    
    /**
     * - Rust return type: `()`
     * - Rust name: `simulator::wasm::globals::update_simulator_params`
     */
    updateParams(): void;
}

export namespace types {    
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
     * - Name: `Mutex<Option<Simulator>>`
     * - Size: `1056`
     * 
     * Fields:
     * | Name     | @      | Type                                                                |
     * | -------- | ------ | ------------------------------------------------------------------- |
     * | `data`   | `0`    | {@link UnsafeCell_Option_Simulator `UnsafeCell<Option<Simulator>>`} |
     * | `locked` | `1048` | {@link UnsafeCell_bool `UnsafeCell<bool>`}                          |
     */
    type Mutex_Option_Simulator = any;
    
    /**
     * - Name: `Simulator`
     * - Size: `1048`
     * 
     * Fields:
     * | Name               | @    | Type                                                                         |
     * | ------------------ | ---- | ---------------------------------------------------------------------------- |
     * | `pipeline`         | `0`  | {@link UnsafeMutRef_dyn_Pipeline `UnsafeMutRef<dyn Pipeline>`}               |
     * | `cache`            | `8`  | {@link UnsafeMutRef_dyn_MemoryAccess `UnsafeMutRef<dyn MemoryAccess>`}       |
     * | `branch_predictor` | `16` | {@link UnsafeMutRef_dyn_BranchPredictor `UnsafeMutRef<dyn BranchPredictor>`} |
     * | `registers`        | `24` | `[u64 ; 128]`                                                                |
     */
    type Simulator = any;
    
    /**
     * - Name: `CacheParams`
     * - Size: `5`
     * 
     * Fields:
     * | Name             | @   | Type                                    |
     * | ---------------- | --- | --------------------------------------- |
     * | `associativity`  | `0` | `u8`                                    |
     * | `block_size_log` | `1` | `u8`                                    |
     * | `num_sets_log`   | `2` | `u8`                                    |
     * | `policy`         | `3` | {@link CachePolicy `CachePolicy`}       |
     * | `write_mode`     | `4` | {@link CacheWriteMode `CacheWriteMode`} |
     */
    type CacheParams = any;
    
    /**
     * - Name: `PipelineParams`
     * - Size: `3`
     * 
     * Fields:
     * | Name            | @   | Type                                      |
     * | --------------- | --- | ----------------------------------------- |
     * | `pipeline_mode` | `0` | {@link PipelineMode `PipelineMode`}       |
     * | `cycle_times`   | `1` | {@link CycleTimeParams `CycleTimeParams`} |
     */
    type PipelineParams = any;
    
    /**
     * - Name: `BranchPredictorParams`
     * - Size: `3`
     * 
     * Fields:
     * | Name                | @   | Type                                                            |
     * | ------------------- | --- | --------------------------------------------------------------- |
     * | `bht_size_log`      | `0` | `u8`                                                            |
     * | `dynamic_predictor` | `1` | {@link DynamicBranchPredictor `DynamicBranchPredictor`}         |
     * | `static_mode`       | `2` | {@link StaticBranchPredictionMode `StaticBranchPredictionMode`} |
     */
    type BranchPredictorParams = any;
    
    /**
     * - Name: `UnsafeCell<Option<Simulator>>`
     * - Size: `1048`
     * 
     * Fields:
     * | Name    | @   | Type                                         |
     * | ------- | --- | -------------------------------------------- |
     * | `value` | `0` | {@link Option_Simulator `Option<Simulator>`} |
     */
    type UnsafeCell_Option_Simulator = any;
    
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
     * - Name: `UnsafeMutRef<dyn MemoryAccess>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                                     |
     * | ----- | --- | -------------------------------------------------------- |
     * | `ptr` | `0` | {@link ptr_mut_dyn_MemoryAccess `*mut dyn MemoryAccess`} |
     */
    type UnsafeMutRef_dyn_MemoryAccess = any;
    
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
     * - Name: `CachePolicy`
     * - Size: `1`
     * - Discriminant layout: `u8` @ `0`
     * 
     * Variants:
     * 
     * - `LRU` (discriminant value = `<default>`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     * 
     * - `NMRU` (discriminant value = `1`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     */
    type CachePolicy = any;
    
    /**
     * - Name: `CacheWriteMode`
     * - Size: `1`
     * - Discriminant layout: `u8` @ `0`
     * 
     * Variants:
     * 
     * - `WriteBack` (discriminant value = `<default>`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     * 
     * - `WriteThrough` (discriminant value = `1`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     */
    type CacheWriteMode = any;
    
    /**
     * - Name: `PipelineMode`
     * - Size: `1`
     * - Discriminant layout: `u8` @ `0`
     * 
     * Variants:
     * 
     * - `None` (discriminant value = `<default>`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     * 
     * - `ThreeStage` (discriminant value = `1`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     * 
     * - `FiveStage` (discriminant value = `2`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     */
    type PipelineMode = any;
    
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
     * - Name: `DynamicBranchPredictor`
     * - Size: `1`
     * - Discriminant layout: `u8` @ `0`
     * 
     * Variants:
     * 
     * - `None` (discriminant value = `<default>`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     * 
     * - `OneBitSaturating` (discriminant value = `1`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     * 
     * - `TwoBitSaturating` (discriminant value = `2`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     */
    type DynamicBranchPredictor = any;
    
    /**
     * - Name: `StaticBranchPredictionMode`
     * - Size: `1`
     * - Discriminant layout: `u8` @ `0`
     * 
     * Variants:
     * 
     * - `Always` (discriminant value = `<default>`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     * 
     * - `Never` (discriminant value = `1`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     * 
     * - `Directional` (discriminant value = `2`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     */
    type StaticBranchPredictionMode = any;
    
    /**
     * - Name: `Option<Simulator>`
     * - Size: `1048`
     * - Discriminant layout: `u32` @ `4`
     * 
     * Variants:
     * 
     * - `None` (discriminant value = `0`):
     * | Name | @ | Type |
     * | ---- | - | ---- |
     * 
     * - `Some` (discriminant value = `<default>`):
     * | Name  | @   | Type                          |
     * | ----- | --- | ----------------------------- |
     * | `__0` | `0` | {@link Simulator `Simulator`} |
     */
    type Option_Simulator = any;
    
    /**
     * - Name: `*mut dyn Pipeline`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                                             |
     * | --------- | --- | ------------------------------------------------ |
     * | `pointer` | `0` | {@link ptr_mut_dyn_Pipeline `*mut dyn Pipeline`} |
     * | `vtable`  | `4` | `&[usize ; 5]`                                   |
     * 
     * Implementations: {@link DummyPipeline `DummyPipeline`}
     */
    type ptr_mut_dyn_Pipeline = any;
    
    /**
     * - Name: `*mut dyn MemoryAccess`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                                                     |
     * | --------- | --- | -------------------------------------------------------- |
     * | `pointer` | `0` | {@link ptr_mut_dyn_MemoryAccess `*mut dyn MemoryAccess`} |
     * | `vtable`  | `4` | `&[usize ; 5]`                                           |
     * 
     * Implementations: {@link DummyMemoryAccess `DummyMemoryAccess`}
     */
    type ptr_mut_dyn_MemoryAccess = any;
    
    /**
     * - Name: `*mut dyn BranchPredictor`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                                                           |
     * | --------- | --- | -------------------------------------------------------------- |
     * | `pointer` | `0` | {@link ptr_mut_dyn_BranchPredictor `*mut dyn BranchPredictor`} |
     * | `vtable`  | `4` | `&[usize ; 7]`                                                 |
     * 
     * Implementations: {@link Predictor0 `Predictor0`}, {@link Predictor1 `Predictor1`}, {@link Predictor2 `Predictor2`}
     */
    type ptr_mut_dyn_BranchPredictor = any;
    
    /**
     * - Name: `DummyPipeline`
     * - Size: `0`
     */
    type DummyPipeline = any;
    
    /**
     * - Name: `DummyMemoryAccess`
     * - Size: `0`
     */
    type DummyMemoryAccess = any;
    
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
     * - Name: `BranchPredictorBase<()>`
     * - Size: `12`
     * 
     * Fields:
     * | Name          | @   | Type                                                            |
     * | ------------- | --- | --------------------------------------------------------------- |
     * | `bht`         | `0` | {@link UnsafeMutRef_BhtEntry `UnsafeMutRef<[BhtEntry<()>]>`}    |
     * | `static_mode` | `8` | {@link StaticBranchPredictionMode `StaticBranchPredictionMode`} |
     */
    type BranchPredictorBase = any;
    
    /**
     * - Name: `BranchPredictorBase<bool>`
     * - Size: `12`
     * 
     * Fields:
     * | Name          | @   | Type                                                                |
     * | ------------- | --- | ------------------------------------------------------------------- |
     * | `bht`         | `0` | {@link UnsafeMutRef_BhtEntry_bool `UnsafeMutRef<[BhtEntry<bool>]>`} |
     * | `static_mode` | `8` | {@link StaticBranchPredictionMode `StaticBranchPredictionMode`}     |
     */
    type BranchPredictorBase_bool = any;
    
    /**
     * - Name: `BranchPredictorBase<u8>`
     * - Size: `12`
     * 
     * Fields:
     * | Name          | @   | Type                                                            |
     * | ------------- | --- | --------------------------------------------------------------- |
     * | `bht`         | `0` | {@link UnsafeMutRef_BhtEntry_u8 `UnsafeMutRef<[BhtEntry<u8>]>`} |
     * | `static_mode` | `8` | {@link StaticBranchPredictionMode `StaticBranchPredictionMode`} |
     */
    type BranchPredictorBase_u8 = any;
    
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
     * - Name: `*mut [BhtEntry<()>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                                 |
     * | ---------- | --- | ------------------------------------ |
     * | `data_ptr` | `0` | {@link BhtEntry `*mut BhtEntry<()>`} |
     * | `length`   | `4` | `usize`                              |
     */
    type ptr_mut_BhtEntry = any;
    
    /**
     * - Name: `*mut [BhtEntry<bool>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                                        |
     * | ---------- | --- | ------------------------------------------- |
     * | `data_ptr` | `0` | {@link BhtEntry_bool `*mut BhtEntry<bool>`} |
     * | `length`   | `4` | `usize`                                     |
     */
    type ptr_mut_BhtEntry_bool = any;
    
    /**
     * - Name: `*mut [BhtEntry<u8>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                                    |
     * | ---------- | --- | --------------------------------------- |
     * | `data_ptr` | `0` | {@link BhtEntry_u8 `*mut BhtEntry<u8>`} |
     * | `length`   | `4` | `usize`                                 |
     */
    type ptr_mut_BhtEntry_u8 = any;
    
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
}

export default module;