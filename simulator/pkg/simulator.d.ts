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
     */
    readonly heap_base: number;
    
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
     * - WASM type: `int`
     */
    readonly data_end: number;
    
    /**
     * - Rust return type: {@link Simulator `Simulator`}
     * - Rust name: `simulator::wasm::globals::alloc_simulator`
     * @param a
     *      - Converted from RVO return value
     *      - WASM type: `int_ptr`
     *      - Rust type: {@link Simulator `&mut simulator::components::Simulator`}
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
     * - Name: `Simulator`
     * - Size: `288`
     * 
     * Fields:
     * | Name               | @     | Type                                |
     * | ------------------ | ----- | ----------------------------------- |
     * | `pipeline`         | `0`   | `UnsafeMutRef<dyn Pipeline>`        |
     * | `cache`            | `8`   | `UnsafeMutRef<dyn Cache>`           |
     * | `branch_predictor` | `16`  | `UnsafeMutRef<dyn BranchPredictor>` |
     * | `registers`        | `24`  | `[u64 ; 32]`                        |
     * | `memory`           | `280` | `Memory`                            |
     */
    type Simulator = any;
    
    /**
     * - Name: `Memory`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                 |
     * | ----- | --- | -------------------- |
     * | `mem` | `0` | `UnsafeMutRef<[u8]>` |
     */
    type Memory = any;
    
    /**
     * - Name: `SimulatorParams`
     * - Size: `11`
     * 
     * Fields:
     * | Name                | @   | Type                    |
     * | ------------------- | --- | ----------------------- |
     * | `cache_params`      | `0` | `CacheParams`           |
     * | `pipeline_params`   | `5` | `PipelineParams`        |
     * | `branch_prediction` | `8` | `BranchPredictorParams` |
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
     * | Name            | @   | Type              |
     * | --------------- | --- | ----------------- |
     * | `pipeline_mode` | `0` | `PipelineMode`    |
     * | `cycle_times`   | `1` | `CycleTimeParams` |
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
     * - Name: `UnsafeMutRef<dyn Pipeline>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                |
     * | ----- | --- | ------------------- |
     * | `ptr` | `0` | `*mut dyn Pipeline` |
     */
    type UnsafeMutRef_dyn_Pipeline = any;
    
    /**
     * - Name: `UnsafeMutRef<dyn Cache>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type             |
     * | ----- | --- | ---------------- |
     * | `ptr` | `0` | `*mut dyn Cache` |
     */
    type UnsafeMutRef_dyn_Cache = any;
    
    /**
     * - Name: `UnsafeMutRef<dyn BranchPredictor>`
     * - Size: `8`
     * 
     * Fields:
     * | Name  | @   | Type                       |
     * | ----- | --- | -------------------------- |
     * | `ptr` | `0` | `*mut dyn BranchPredictor` |
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
     * | Name     | @     | Type                            |
     * | -------- | ----- | ------------------------------- |
     * | `data`   | `0`   | `UnsafeCell<Option<Simulator>>` |
     * | `locked` | `288` | `UnsafeCell<bool>`              |
     */
    type Mutex_Option_Simulator = any;
    
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
     * - Name: `*mut dyn Pipeline`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                |
     * | --------- | --- | ------------------- |
     * | `pointer` | `0` | `*mut dyn Pipeline` |
     * | `vtable`  | `4` | `&[usize ; 5]`      |
     */
    type ptr_mut_dyn_Pipeline = any;
    
    /**
     * - Name: `*mut dyn Cache`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type             |
     * | --------- | --- | ---------------- |
     * | `pointer` | `0` | `*mut dyn Cache` |
     * | `vtable`  | `4` | `&[usize ; 5]`   |
     */
    type ptr_mut_dyn_Cache = any;
    
    /**
     * - Name: `*mut dyn BranchPredictor`
     * - Size: `8`
     * 
     * Fields:
     * | Name      | @   | Type                       |
     * | --------- | --- | -------------------------- |
     * | `pointer` | `0` | `*mut dyn BranchPredictor` |
     * | `vtable`  | `4` | `&[usize ; 7]`             |
     */
    type ptr_mut_dyn_BranchPredictor = any;
    
    /**
     * - Name: `*mut [u8]`
     * - Size: `8`
     * 
     * Fields:
     * | Name       | @   | Type      |
     * | ---------- | --- | --------- |
     * | `data_ptr` | `0` | `*mut u8` |
     * | `length`   | `4` | `usize`   |
     */
    type ptr_mut_u8 = any;
}

export default module;