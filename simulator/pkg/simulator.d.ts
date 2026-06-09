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
// noinspection JSUnusedGlobalSymbols
export default module;