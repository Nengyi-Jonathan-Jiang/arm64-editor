# Requirements to build
`cargo` and [wabt](https://github.com/WebAssembly/wabt) (specifically 
`wasm-decompile`, `wasm-opt`, and `wasm-strip`) must be installed.

If [`llvm-dwarfdump`](https://github.com/llvm) is also installed, generated TypeScript 
definitions will have more detailed type and parameter info.

# Building
Run `cargo build --profile wasm` to compile the binary and 
then run `./copy-out.sh` to copy and optimize the WASM output. 
Cargo build should ALWAYS be built in the custom `wasm`
profile. 

Alternatively, these can be done in one step if
[Cargo make](https://github.com/sagiegurari/cargo-make)
is installed; run `cargo make all` (which automatically 
selects the wasm profile and runs the copy script)

# Generate definitions
If types need to be updated for WASM functions or variables, run 
`generate-ts-defs/generate.py` to regenerate the type definitions.