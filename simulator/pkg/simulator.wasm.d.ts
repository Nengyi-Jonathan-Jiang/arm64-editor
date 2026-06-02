/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const get_params_ptr: () => number;
export const greet: () => void;
export const initialize_simulator: () => void;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __wbindgen_start: () => void;

/**
 * Rust return type: `simulator::js_interop::params::SimulatorParams`
 * Rust name: `do_thing`
 * @param a
 *      * Converted from RVO return value
 *      * type: `int`
 *      * Rust type: `simulator::js_interop::params::SimulatorParams`
 * @param b type: `{ a:int, b:long }`
 *     Rust type: `(u32, u64) *`
 *     Rust name: `f`
 * @param c type: `int`
 *     Rust type: `core::option::Option<[u64; 5]> *`
 *     Rust name: `g`
 * @param d type: `int`
 *     Rust type: `u32`
 *     Rust name: `h`
 * @param e type: `int`
 *     Rust type: `bool`
 *     Rust name: `i`
 */
export function x(a: number, b: number, c: number, d: number, e: number): void;