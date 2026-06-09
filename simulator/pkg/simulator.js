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
                    try {
                        memory.grow(Math.ceil(required_amount_bytes / bytesPerPage));
                    } catch (e) {
                        if (e instanceof RangeError) {
                            return 0; // Too much memory; return 0 (aka NULL)
                        }
                        // Something else weird happened.
                        throw e;
                    }
                }
                return memory.buffer.byteLength;
            }
        }
    }
);

const raw_module = WASM_instantiate_result.instance.exports;

/** @type {typeof WASM_simulator} */
const module = {};

/**
 * @template {Function} T
 * @param {T} f
 * @returns {T}
 */
function catch_wasm(f) {
    return (...args) => {
        try {
            f(...args)
        } catch (e) {
            if (e instanceof WebAssembly.RuntimeError
                && e.message === "unreachable") {
                const panicMessageBytes = module.memory.buffer.slice(
                    module.panicBuffer,
                    module.panicBuffer + module.panicBufferLen
                );
                const panicMessage = new TextDecoder()
                    .decode(panicMessageBytes)
                    .split('\0')
                    [0] ?? 'unknown reason';

                module.clearPanicBuffer();

                // noinspection JSCheckFunctionSignatures
                throw new Error(`${panicMessage}`, {cause: e});
            }
            throw e;
        }
    }
}

for (const key in raw_module) {
    const entry = raw_module[key];
    if (typeof entry === 'function') {
        module[key] = catch_wasm(entry);
    } else {
        module[key] = entry;
    }
}

Object.freeze(module);

export const WASM_simulator = module;
export default WASM_simulator;