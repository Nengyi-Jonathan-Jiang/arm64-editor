# Requirements to build
`cargo` and [wabt](https://github.com/WebAssembly/wabt) (specifically 
`wasm-decompile`, `wasm-opt`, and `wasm-strip`) must be installed.

If [`llvm-dwarfdump`](https://github.com/llvm) is also installed, generated TypeScript 
definitions will have more detailed type and parameter info.

# Building
Run `cargo build` to compile the binary and 
`./copy-out.sh` to copy and optimize the WASM output. 
Cargo build should ALWAYS be built in the dev profile; 
it is the job of subsequent passes to further optimize 
the WASM. 

Alternatively, these can be done in one step if
[Cargo make](https://github.com/sagiegurari/cargo-make)
is installed; run `cargo make copy-out`
