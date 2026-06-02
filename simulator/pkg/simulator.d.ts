export const module : {    
    readonly memory: WebAssembly.Memory;
    
    /**
     * - WASM type: `int`
     * - Rust name: `PARAMS_VOLATILE`
     * - Rust type: `core::mem::maybe_uninit::MaybeUninit<simulator::js_interop::params::SimulatorParams>`
     */
    readonly params_ptr: number;
    
    /**
     * - WASM type: `int`
     */
    readonly heap_base: number;
    
    /**
     * - WASM type: `int`
     */
    readonly data_end: number;
    
    /**
     * - Rust name: `init_simulator`
     */
    initSimulator(): void;
    
    /**
     * - Return type: `int`
     * - Rust return type: `() *`
     * - Rust name: `append`
     * @param a
     *      - WASM type: `int`
     *      - Rust type: `usize`
     *      - Rust name: `num_bytes`
     */
    append(a: number): number;
}
// noinspection JSUnusedGlobalSymbols
export default module;