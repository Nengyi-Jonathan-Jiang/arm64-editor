# Requirements to build
`cargo` and [wabt](https://github.com/WebAssembly/wabt) (specifically 
`wasm-decompile`, `wasm-opt`, and `wasm-strip`) must be installed.

If [`llvm-dwarfdump`](https://github.com/llvm) is also installed, generated TypeScript 
definitions will have more detailed type and parameter info.

# Building
Run `cargo build --target wasm32-unknown-unknown --profile wasm` to 
compile the binary. The `dev` target may also be used to enable 
assertions and checks.

Then, run `./pkg.sh` to optimize the WASM module and copy it to
the `pkg` directory for the main web app to use.

Alternatively, these can be done in one step if
[Cargo make](https://github.com/sagiegurari/cargo-make)
is installed; run `cargo make all` (which automatically 
selects the wasm profile and runs the copy script)

# Testing
Run `cargo test` to run all unit tests.

# Generate definitions
If TypeScript types need to be updated for WASM functions or variables, 
run `generate-ts-defs/generate.py` to regenerate the type definitions.