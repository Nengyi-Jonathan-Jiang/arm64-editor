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
     * - Rust type: `simulator::params::SimulatorParams`
     */
    readonly paramsPtr: number;
    
    /**
     * - WASM type: `int`
     */
    readonly heap_base: number;
    
    /**
     * - WASM type: `int`
     * - Rust name: `SIMULATOR`
     * - Rust type: `simulator::wasm::wasm_mutex::Mutex<core::option::Option<simulator::components::Simulator>>`
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
     * - Rust return type: `simulator::components::Simulator`
     * - Rust name: `alloc_simulator`
     * @param a
     *      - Converted from RVO return value
     *      - WASM type: `int_ptr`
     *      - Rust type: `&mut simulator::components::Simulator`
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
     * - Name: `<Predictor0 as BranchPredictor>::{vtable_type}`
     * - Size: `28`
     * 
     * Fields:
     * | Name            | @    | Type    |
     * | --------------- | ---- | ------- |
     * | `drop_in_place` | `0`  | `() *`  |
     * | `size`          | `4`  | `usize` |
     * | `align`         | `8`  | `usize` |
     * | `__method3`     | `12` | `() *`  |
     * | `__method4`     | `16` | `() *`  |
     * | `__method5`     | `20` | `() *`  |
     * | `__method6`     | `24` | `() *`  |
     */
    type Predictor0_as_BranchPredictor_vtable_type = never;
    
    /**
     * - Name: `Predictor0`
     * - Size: `12`
     * 
     * Fields:
     * | Name   | @   | Type                                                  |
     * | ------ | --- | ----------------------------------------------------- |
     * | `base` | `0` | {@link BranchPredictorBase `BranchPredictorBase<()>`} |
     */
    type Predictor0 = never;
    
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
    type BranchPredictorBase = never;
    
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
    type BhtEntry = never;
    
    /**
     * - Name: `Predictor2`
     * - Size: `12`
     * 
     * Fields:
     * | Name   | @   | Type                                                     |
     * | ------ | --- | -------------------------------------------------------- |
     * | `base` | `0` | {@link BranchPredictorBase_u8 `BranchPredictorBase<u8>`} |
     */
    type Predictor2 = never;
    
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
    type BranchPredictorBase_u8 = never;
    
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
    type BhtEntry_u8 = never;
    
    /**
     * - Name: `Predictor1`
     * - Size: `12`
     * 
     * Fields:
     * | Name   | @   | Type                                                         |
     * | ------ | --- | ------------------------------------------------------------ |
     * | `base` | `0` | {@link BranchPredictorBase_bool `BranchPredictorBase<bool>`} |
     */
    type Predictor1 = never;
    
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
    type BranchPredictorBase_bool = never;
    
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
    type BhtEntry_bool = never;
    
    /**
     * - Name: `{closure_env#0}<Predictor2, fn(usize, usize) -> *mut ()>`
     * - Size: `0`
     */
    type impl_4_closure_env_0_Predictor2_fn_usize_usize_ptr_mut = never;
    
    /**
     * - Name: `{closure_env#0}<Predictor1, fn(usize, usize) -> *mut ()>`
     * - Size: `0`
     */
    type impl_4_closure_env_0_Predictor1_fn_usize_usize_ptr_mut = never;
    
    /**
     * - Name: `{closure_env#0}<Predictor0, fn(usize, usize) -> *mut ()>`
     * - Size: `0`
     */
    type impl_4_closure_env_0_Predictor0_fn_usize_usize_ptr_mut = never;
    
    /**
     * - Name: `DummyCache`
     * - Size: `0`
     */
    type DummyCache = never;
    
    /**
     * - Name: `{closure_env#0}`
     * - Size: `0`
     */
    type impl_0_closure_env_0 = never;
    
    /**
     * - Name: `DummyPipeline`
     * - Size: `0`
     */
    type DummyPipeline = never;
    
    /**
     * - Name: `{closure_env#0}`
     * - Size: `0`
     */
    type impl_0_closure_env_0$16 = never;
    
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
    type Simulator = never;
    
    /**
     * - Name: `Memory`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                         |
     * | ----- | --- | -------------------------------------------- |
     * | `mem` | `0` | {@link UnsafeMutRef_u8 `UnsafeMutRef<[u8]>`} |
     */
    type Memory = never;
    
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
    type SimulatorParams = never;
    
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
    type CacheParams = never;
    
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
    type PipelineParams = never;
    
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
    type CycleTimeParams = never;
    
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
    type BranchPredictorParams = never;
    
    /**
     * - Name: `UnsafeMutRef<[BhtEntry<()>]>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                           |
     * | ----- | --- | ---------------------------------------------- |
     * | `ptr` | `0` | {@link ptr_mut_BhtEntry `*mut [BhtEntry<()>]`} |
     */
    type UnsafeMutRef_BhtEntry = never;
    
    /**
     * - Name: `UnsafeMutRef<[BhtEntry<u8>]>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                              |
     * | ----- | --- | ------------------------------------------------- |
     * | `ptr` | `0` | {@link ptr_mut_BhtEntry_u8 `*mut [BhtEntry<u8>]`} |
     */
    type UnsafeMutRef_BhtEntry_u8 = never;
    
    /**
     * - Name: `UnsafeMutRef<[BhtEntry<bool>]>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                                  |
     * | ----- | --- | ----------------------------------------------------- |
     * | `ptr` | `0` | {@link ptr_mut_BhtEntry_bool `*mut [BhtEntry<bool>]`} |
     */
    type UnsafeMutRef_BhtEntry_bool = never;
    
    /**
     * - Name: `UnsafeMutRef<dyn Pipeline>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                             |
     * | ----- | --- | ------------------------------------------------ |
     * | `ptr` | `0` | {@link ptr_mut_dyn_Pipeline `*mut dyn Pipeline`} |
     */
    type UnsafeMutRef_dyn_Pipeline = never;
    
    /**
     * - Name: `UnsafeMutRef<dyn Cache>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                       |
     * | ----- | --- | ------------------------------------------ |
     * | `ptr` | `0` | {@link ptr_mut_dyn_Cache `*mut dyn Cache`} |
     */
    type UnsafeMutRef_dyn_Cache = never;
    
    /**
     * - Name: `UnsafeMutRef<dyn BranchPredictor>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                                           |
     * | ----- | --- | -------------------------------------------------------------- |
     * | `ptr` | `0` | {@link ptr_mut_dyn_BranchPredictor `*mut dyn BranchPredictor`} |
     */
    type UnsafeMutRef_dyn_BranchPredictor = never;
    
    /**
     * - Name: `UnsafeMutRef<[u8]>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                           |
     * | ----- | --- | ------------------------------ |
     * | `ptr` | `0` | {@link ptr_mut_u8 `*mut [u8]`} |
     */
    type UnsafeMutRef_u8 = never;
    
    /**
     * - Name: `UnsafeMutRef<Predictor2>`
     * - Size: `4`
     * 
     * Fields:
     * | Name  | @   | Type                              |
     * | ----- | --- | --------------------------------- |
     * | `ptr` | `0` | {@link Predictor2 `Predictor2 *`} |
     */
    type UnsafeMutRef_Predictor2 = never;
    
    /**
     * - Name: `UnsafeMutRef<Predictor1>`
     * - Size: `4`
     * 
     * Fields:
     * | Name  | @   | Type                              |
     * | ----- | --- | --------------------------------- |
     * | `ptr` | `0` | {@link Predictor1 `Predictor1 *`} |
     */
    type UnsafeMutRef_Predictor1 = never;
    
    /**
     * - Name: `UnsafeMutRef<Predictor0>`
     * - Size: `4`
     * 
     * Fields:
     * | Name  | @   | Type                              |
     * | ----- | --- | --------------------------------- |
     * | `ptr` | `0` | {@link Predictor0 `Predictor0 *`} |
     */
    type UnsafeMutRef_Predictor0 = never;
    
    /**
     * - Name: `UnsafeMutRef<DummyPipeline>`
     * - Size: `4`
     * 
     * Fields:
     * | Name  | @   | Type                                    |
     * | ----- | --- | --------------------------------------- |
     * | `ptr` | `0` | {@link DummyPipeline `DummyPipeline *`} |
     */
    type UnsafeMutRef_DummyPipeline = never;
    
    /**
     * - Name: `UnsafeMutRef<DummyCache>`
     * - Size: `4`
     * 
     * Fields:
     * | Name  | @   | Type                              |
     * | ----- | --- | --------------------------------- |
     * | `ptr` | `0` | {@link DummyCache `DummyCache *`} |
     */
    type UnsafeMutRef_DummyCache = never;
    
    /**
     * - Name: `Mutex<SimulatorParams>`
     * - Size: `12`
     * 
     * Fields:
     * | Name     | @   | Type                                                             |
     * | -------- | --- | ---------------------------------------------------------------- |
     * | `locked` | `0` | {@link UnsafeCell_bool `UnsafeCell<bool>`}                       |
     * | `data`   | `1` | {@link UnsafeCell_SimulatorParams `UnsafeCell<SimulatorParams>`} |
     */
    type Mutex_SimulatorParams = never;
    
    /**
     * - Name: `Mutex<*mut ()>`
     * - Size: `8`
     * 
     * Fields:
     * | Name     | @   | Type                                             |
     * | -------- | --- | ------------------------------------------------ |
     * | `data`   | `0` | {@link UnsafeCell_ptr_mut `UnsafeCell<*mut ()>`} |
     * | `locked` | `4` | {@link UnsafeCell_bool `UnsafeCell<bool>`}       |
     */
    type Mutex_ptr_mut = never;
    
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
    type Mutex_Option_Simulator = never;
    
    /**
     * - Name: `MutexGuard<*mut ()>`
     * - Size: `4`
     * 
     * Fields:
     * | Name   | @   | Type                                     |
     * | ------ | --- | ---------------------------------------- |
     * | `lock` | `0` | {@link Mutex_ptr_mut `Mutex<*mut ()> *`} |
     */
    type MutexGuard_ptr_mut = never;
    
    /**
     * - Name: `MutexGuard<SimulatorParams>`
     * - Size: `4`
     * 
     * Fields:
     * | Name   | @   | Type                                                     |
     * | ------ | --- | -------------------------------------------------------- |
     * | `lock` | `0` | {@link Mutex_SimulatorParams `Mutex<SimulatorParams> *`} |
     */
    type MutexGuard_SimulatorParams = never;
    
    /**
     * - Name: `MutexGuard<Option<Simulator>>`
     * - Size: `4`
     * 
     * Fields:
     * | Name   | @   | Type                                                        |
     * | ------ | --- | ----------------------------------------------------------- |
     * | `lock` | `0` | {@link Mutex_Option_Simulator `Mutex<Option<Simulator>> *`} |
     */
    type MutexGuard_Option_Simulator = never;
    
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
    type ptr_mut_BhtEntry = never;
    
    /**
     * - Name: `<Predictor2 as BranchPredictor>::{vtable_type}`
     * - Size: `28`
     * 
     * Fields:
     * | Name            | @    | Type    |
     * | --------------- | ---- | ------- |
     * | `drop_in_place` | `0`  | `() *`  |
     * | `size`          | `4`  | `usize` |
     * | `align`         | `8`  | `usize` |
     * | `__method3`     | `12` | `() *`  |
     * | `__method4`     | `16` | `() *`  |
     * | `__method5`     | `20` | `() *`  |
     * | `__method6`     | `24` | `() *`  |
     */
    type Predictor2_as_BranchPredictor_vtable_type = never;
    
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
    type ptr_mut_BhtEntry_u8 = never;
    
    /**
     * - Name: `<Predictor1 as BranchPredictor>::{vtable_type}`
     * - Size: `28`
     * 
     * Fields:
     * | Name            | @    | Type    |
     * | --------------- | ---- | ------- |
     * | `drop_in_place` | `0`  | `() *`  |
     * | `size`          | `4`  | `usize` |
     * | `align`         | `8`  | `usize` |
     * | `__method3`     | `12` | `() *`  |
     * | `__method4`     | `16` | `() *`  |
     * | `__method5`     | `20` | `() *`  |
     * | `__method6`     | `24` | `() *`  |
     */
    type Predictor1_as_BranchPredictor_vtable_type = never;
    
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
    type ptr_mut_BhtEntry_bool = never;
    
    /**
     * - Name: `<DummyCache as Cache>::{vtable_type}`
     * - Size: `20`
     * 
     * Fields:
     * | Name            | @    | Type    |
     * | --------------- | ---- | ------- |
     * | `drop_in_place` | `0`  | `() *`  |
     * | `size`          | `4`  | `usize` |
     * | `align`         | `8`  | `usize` |
     * | `__method3`     | `12` | `() *`  |
     * | `__method4`     | `16` | `() *`  |
     */
    type DummyCache_as_Cache_vtable_type = never;
    
    /**
     * - Name: `<DummyPipeline as Pipeline>::{vtable_type}`
     * - Size: `20`
     * 
     * Fields:
     * | Name            | @    | Type    |
     * | --------------- | ---- | ------- |
     * | `drop_in_place` | `0`  | `() *`  |
     * | `size`          | `4`  | `usize` |
     * | `align`         | `8`  | `usize` |
     * | `__method3`     | `12` | `() *`  |
     * | `__method4`     | `16` | `() *`  |
     */
    type DummyPipeline_as_Pipeline_vtable_type = never;
    
    /**
     * - Name: `UnsafeCell<bool>`
     * - Size: `1`
     * 
     * Fields:
     * | Name    | @   | Type   |
     * | ------- | --- | ------ |
     * | `value` | `0` | `bool` |
     */
    type UnsafeCell_bool = never;
    
    /**
     * - Name: `UnsafeCell<SimulatorParams>`
     * - Size: `11`
     * 
     * Fields:
     * | Name    | @   | Type                                      |
     * | ------- | --- | ----------------------------------------- |
     * | `value` | `0` | {@link SimulatorParams `SimulatorParams`} |
     */
    type UnsafeCell_SimulatorParams = never;
    
    /**
     * - Name: `UnsafeCell<*mut ()>`
     * - Size: `4`
     * 
     * Fields:
     * | Name    | @   | Type   |
     * | ------- | --- | ------ |
     * | `value` | `0` | `() *` |
     */
    type UnsafeCell_ptr_mut = never;
    
    /**
     * - Name: `UnsafeCell<Option<Simulator>>`
     * - Size: `288`
     * 
     * Fields:
     * | Name    | @   | Type                                         |
     * | ------- | --- | -------------------------------------------- |
     * | `value` | `0` | {@link Option_Simulator `Option<Simulator>`} |
     */
    type UnsafeCell_Option_Simulator = never;
    
    /**
     * - Name: `Option<Simulator>`
     * - Size: `288`
     */
    type Option_Simulator = never;
    
    /**
     * - Name: `Option<&str>`
     * - Size: `8`
     */
    type Option_ref_str = never;
    
    /**
     * - Name: `PanicInfo`
     * - Size: `12`
     * 
     * Fields:
     * | Name                 | @   | Type                            |
     * | -------------------- | --- | ------------------------------- |
     * | `message`            | `0` | {@link Arguments `Arguments *`} |
     * | `location`           | `4` | {@link Location `Location *`}   |
     * | `can_unwind`         | `8` | `bool`                          |
     * | `force_no_backtrace` | `9` | `bool`                          |
     */
    type PanicInfo = never;
    
    /**
     * - Name: `PanicMessage`
     * - Size: `4`
     * 
     * Fields:
     * | Name      | @   | Type                            |
     * | --------- | --- | ------------------------------- |
     * | `message` | `0` | {@link Arguments `Arguments *`} |
     */
    type PanicMessage = never;
    
    /**
     * - Name: `Location`
     * - Size: `16`
     * 
     * Fields:
     * | Name        | @    | Type                                            |
     * | ----------- | ---- | ----------------------------------------------- |
     * | `filename`  | `0`  | {@link NonNull_str `NonNull<str>`}              |
     * | `line`      | `8`  | `u32`                                           |
     * | `col`       | `12` | `u32`                                           |
     * | `_filename` | `16` | {@link PhantomData_ref_str `PhantomData<&str>`} |
     */
    type Location = never;
    
    /**
     * - Name: `Arguments`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                                         |
     * | ---------- | --- | -------------------------------------------- |
     * | `template` | `0` | {@link NonNull_u8 `NonNull<u8>`}             |
     * | `args`     | `4` | {@link NonNull_Argument `NonNull<Argument>`} |
     */
    type Arguments = never;
    
    /**
     * - Name: `Argument`
     * - Size: `8`
     * 
     * Fields:
     * | Name | @   | Type                                |
     * | ---- | --- | ----------------------------------- |
     * | `ty` | `0` | {@link ArgumentType `ArgumentType`} |
     */
    type Argument = never;
    
    /**
     * - Name: `ArgumentType`
     * - Size: `8`
     */
    type ArgumentType = never;
    
    /**
     * - Name: `Error`
     * - Size: `0`
     */
    type Error = never;
    
    /**
     * - Name: `Formatter`
     * - Size: `16`
     * 
     * Fields:
     * | Name      | @   | Type                                          |
     * | --------- | --- | --------------------------------------------- |
     * | `buf`     | `0` | {@link ref_mut_dyn_Write `&mut dyn Write`}    |
     * | `options` | `8` | {@link FormattingOptions `FormattingOptions`} |
     */
    type Formatter = never;
    
    /**
     * - Name: `FormattingOptions`
     * - Size: `8`
     * 
     * Fields:
     * | Name        | @   | Type  |
     * | ----------- | --- | ----- |
     * | `flags`     | `0` | `u32` |
     * | `width`     | `4` | `u16` |
     * | `precision` | `6` | `u16` |
     */
    type FormattingOptions = never;
    
    /**
     * - Name: `NonNull<u8>`
     * - Size: `4`
     * 
     * Fields:
     * | Name      | @   | Type   |
     * | --------- | --- | ------ |
     * | `pointer` | `0` | `u8 *` |
     */
    type NonNull_u8 = never;
    
    /**
     * - Name: `NonNull<Argument>`
     * - Size: `4`
     * 
     * Fields:
     * | Name      | @   | Type                          |
     * | --------- | --- | ----------------------------- |
     * | `pointer` | `0` | {@link Argument `Argument *`} |
     */
    type NonNull_Argument = never;
    
    /**
     * - Name: `NonNull<()>`
     * - Size: `4`
     * 
     * Fields:
     * | Name      | @   | Type   |
     * | --------- | --- | ------ |
     * | `pointer` | `0` | `() *` |
     */
    type NonNull = never;
    
    /**
     * - Name: `NonNull<str>`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type         |
     * | --------- | --- | ------------ |
     * | `pointer` | `0` | `*const str` |
     */
    type NonNull_str = never;
    
    /**
     * - Name: `Result<(), Error>`
     * - Size: `1`
     */
    type Result_Error = never;
    
    /**
     * - Name: `Result<u8, ()>`
     * - Size: `2`
     */
    type Result_u8 = never;
    
    /**
     * - Name: `Result<(), ()>`
     * - Size: `1`
     */
    type Result = never;
    
    /**
     * - Name: `PhantomData<&()>`
     * - Size: `0`
     */
    type PhantomData_ref = never;
    
    /**
     * - Name: `PhantomData<&str>`
     * - Size: `0`
     */
    type PhantomData_ref_str = never;
    
    /**
     * - Name: `dyn Pipeline`
     * - Size: `0`
     */
    type dyn_Pipeline = never;
    
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
    type ptr_mut_dyn_Pipeline = never;
    
    /**
     * - Name: `dyn Cache`
     * - Size: `0`
     */
    type dyn_Cache = never;
    
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
    type ptr_mut_dyn_Cache = never;
    
    /**
     * - Name: `dyn BranchPredictor`
     * - Size: `0`
     */
    type dyn_BranchPredictor = never;
    
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
    type ptr_mut_dyn_BranchPredictor = never;
    
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
    type ptr_mut_u8 = never;
    
    /**
     * - Name: `&mut dyn Write`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                            |
     * | --------- | --- | ------------------------------- |
     * | `pointer` | `0` | {@link dyn_Write `dyn Write *`} |
     * | `vtable`  | `4` | `usize (*)[6]`                  |
     */
    type ref_mut_dyn_Write = never;
    
    /**
     * - Name: `dyn Write`
     * - Size: `0`
     */
    type dyn_Write = never;
    
    /**
     * - Name: `*const str`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type    |
     * | ---------- | --- | ------- |
     * | `data_ptr` | `0` | `u8 *`  |
     * | `length`   | `4` | `usize` |
     */
    type ptr_const_str = never;
    
    /**
     * - Name: `&str`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type    |
     * | ---------- | --- | ------- |
     * | `data_ptr` | `0` | `u8 *`  |
     * | `length`   | `4` | `usize` |
     */
    type ref_str = never;
    
    /**
     * - Name: `(usize, usize)`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type    |
     * | ----- | --- | ------- |
     * | `__0` | `0` | `usize` |
     * | `__1` | `4` | `usize` |
     */
    type usize_usize = never;
    
    /**
     * - Name: `&mut dyn BranchPredictor`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                                                |
     * | --------- | --- | --------------------------------------------------- |
     * | `pointer` | `0` | {@link dyn_BranchPredictor `dyn BranchPredictor *`} |
     * | `vtable`  | `4` | `usize (*)[7]`                                      |
     */
    type ref_mut_dyn_BranchPredictor = never;
    
    /**
     * - Name: `&[BhtEntry<bool>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                                     |
     * | ---------- | --- | ---------------------------------------- |
     * | `data_ptr` | `0` | {@link BhtEntry_bool `BhtEntry<bool> *`} |
     * | `length`   | `4` | `usize`                                  |
     */
    type ref_BhtEntry_bool = never;
    
    /**
     * - Name: `&[BhtEntry<()>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                              |
     * | ---------- | --- | --------------------------------- |
     * | `data_ptr` | `0` | {@link BhtEntry `BhtEntry<()> *`} |
     * | `length`   | `4` | `usize`                           |
     */
    type ref_BhtEntry = never;
    
    /**
     * - Name: `&mut [BhtEntry<()>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                              |
     * | ---------- | --- | --------------------------------- |
     * | `data_ptr` | `0` | {@link BhtEntry `BhtEntry<()> *`} |
     * | `length`   | `4` | `usize`                           |
     */
    type ref_mut_BhtEntry = never;
    
    /**
     * - Name: `&[BhtEntry<u8>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                                 |
     * | ---------- | --- | ------------------------------------ |
     * | `data_ptr` | `0` | {@link BhtEntry_u8 `BhtEntry<u8> *`} |
     * | `length`   | `4` | `usize`                              |
     */
    type ref_BhtEntry_u8 = never;
    
    /**
     * - Name: `&mut [BhtEntry<bool>]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type                                     |
     * | ---------- | --- | ---------------------------------------- |
     * | `data_ptr` | `0` | {@link BhtEntry_bool `BhtEntry<bool> *`} |
     * | `length`   | `4` | `usize`                                  |
     */
    type ref_mut_BhtEntry_bool = never;
    
    /**
     * - Name: `&mut dyn Pipeline`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                                  |
     * | --------- | --- | ------------------------------------- |
     * | `pointer` | `0` | {@link dyn_Pipeline `dyn Pipeline *`} |
     * | `vtable`  | `4` | `usize (*)[5]`                        |
     */
    type ref_mut_dyn_Pipeline = never;
    
    /**
     * - Name: `&mut dyn Cache`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                            |
     * | --------- | --- | ------------------------------- |
     * | `pointer` | `0` | {@link dyn_Cache `dyn Cache *`} |
     * | `vtable`  | `4` | `usize (*)[5]`                  |
     */
    type ref_mut_dyn_Cache = never;
    
    /**
     * - Name: `(MutexGuard<*mut ()>, MutexGuard<*mut ()>)`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                                             |
     * | ----- | --- | ------------------------------------------------ |
     * | `__0` | `0` | {@link MutexGuard_ptr_mut `MutexGuard<*mut ()>`} |
     * | `__1` | `4` | {@link MutexGuard_ptr_mut `MutexGuard<*mut ()>`} |
     */
    type MutexGuard_ptr_mut_MutexGuard_ptr_mut = never;
    
    /**
     * - Name: `(bool, u64)`
     * - Size: `16`
     * 
     * Fields:
     * | Name  | @   | Type   |
     * | ----- | --- | ------ |
     * | `__0` | `0` | `bool` |
     * | `__1` | `8` | `u64`  |
     */
    type bool_u64 = never;
}

export default module;