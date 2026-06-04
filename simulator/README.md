# Build Requirements

Required:
- Rust and `cargo`
- `wabt` (for WebAssembly-specific optimization passes)
- Either `bash` or `python` (used by build scripts)

Optional:
- `python` to regenerate TypeScript definitions
- [`llvm-dwarfdump`](https://github.com/llvm) enables generation of more detailed TypeScript type 
  information
- [`cargo make`](https://github.com/sagiegurari/cargo-make) to run the full build with one command

# Building

### Using Cargo Make 

If Cargo Make is installed, run:
`cargo make all`

### Manual

If Cargo Make is not available, perform the build steps manually:

#### 1. Compile the Rust crate to WebAssembly

Build for the `wasm32-unknown-unknown` target using either the `dev` profile or 
the custom `wasm` profile:

```bash
cargo build --target wasm32-unknown-unknown --profile wasm
```

#### 2. Package and optimize the generated WebAssembly

```bash
bash ./scripts/pkg.sh
```

This runs WebAssembly-specific optimization passes provided by WABT and copies 
the generated artifacts into the directory structure expected by webpack

#### 3. Regenerate TypeScript definitions (optional)

If exported WASM functions, globals, or types have changed, regenerate the 
TypeScript bindings:

```bash
python ./scripts/ts-defs.py
```

## Testing

Run all unit tests on the host target:

```bash
cargo test
```

Tests should be executed natively rather than through the WebAssembly target.
