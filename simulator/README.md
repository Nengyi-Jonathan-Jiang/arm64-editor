# Requirements to build
`cargo` and [wabt](https://github.com/WebAssembly/wabt) (specifically 
`wasm-decompile`, `wasm-opt`, and `wasm-strip`) must be installed.

If TypeScript definitions need to be updated, `python` is also required.
[`llvm-dwarfdump`](https://github.com/llvm) can also be installed to allow generated TypeScript 
definitions to have more detailed type and parameter info.

# Building
The target should be set to `wasm32-unknown-unknown` for all commands 
that use it, either through an environment variable or by using the 
corresponding argument, ***unless*** the target profile is `test`. 
Since there is no easy way to test WASM binaries using Rust's built-in
`cargo test`, tests should instead be built and run for the host 
architecture.

Run `cargo build --profile wasm` to 
compile the binary. The `dev` target may also be used to enable 
assertions and checks.

Then, run `./scripts/pkg.sh` to optimize the WASM module and copy it to
the `pkg` directory for the main web app to use, as well as generate 
debugging info 

If TypeScript types need to be updated for WASM functions or variables,
run `python generate-ts-defs/generate.py` to regenerate the type 
definitions.

Alternatively, these can be done in one step if
[Cargo make](https://github.com/sagiegurari/cargo-make)
is installed; run `cargo make all`

# Testing
Run `cargo test` to run all unit tests.