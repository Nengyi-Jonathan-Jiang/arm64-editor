basename = "simulator"

dir_out = "./pkg"

file_wasm_unoptimized = f"{dir_out}/{basename}.unoptimized.wasm"
file_wasm_temp = f"{dir_out}/temp.wasm"
file_wasm_optimized = f"{dir_out}/{basename}.wasm"
file_ts_defs = f"{dir_out}/{basename}.d.ts"

file_glob_rust_build = f'target/wasm32-unknown-unknown/**/{basename}.wasm'

if __name__ == '__main__':
    raise RuntimeError(
        'This is a module, not a script. Did you mean to run ts-defs.py?'
    )
