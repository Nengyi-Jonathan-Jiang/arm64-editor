/* @ts-self-types="./simulator.d.ts" */

const WASM_instantiate_result = await WebAssembly.instantiateStreaming(
    fetch(new URL('simulator.wasm', import.meta.url)),
    {
        "env": {
            /**
             * @type {number} ptr
             * @returns {number}
             */
            request_enough_mem_for_ptr(ptr) {
                const memory = WASM_simulator.memory;
                const required_amount_bytes = ptr - memory.buffer.byteLength;
                const bytesPerPage = 64 * 1024;
                if (required_amount_bytes > 0) {
                    memory.grow(Math.ceil(required_amount_bytes / bytesPerPage));
                }
                return memory.buffer.byteLength;
            }
        }
    }
);

export const WASM_simulator = WASM_instantiate_result.instance.exports;
// noinspection JSUnusedGlobalSymbols
export default WASM_simulator;