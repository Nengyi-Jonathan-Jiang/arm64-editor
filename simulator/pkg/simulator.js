/* @ts-self-types="./simulator.d.ts" */

const WASM_instantiate_result = await WebAssembly.instantiateStreaming(
    fetch(new URL('simulator.wasm', import.meta.url)),
    {

    }
);
console.log(WASM_instantiate_result);

export const WASM_simulator = WASM_instantiate_result.instance.exports;