basename = "simulator"

dir_out = "./pkg"

file_wasm = f"{dir_out}/{basename}.wasm"
file_wasm_temp = f"{dir_out}/temp.wasm"
file_wasm_debug = f"{dir_out}/{basename}.debug.wasm"

file_wasm_decompiled = f"{dir_out}/{basename}.wasm.decompiled.txt"
file_ts_defs = f"{dir_out}/{basename}.d.ts"

file_glob_rust_build = f'target/wasm32-unknown-unknown/**/{basename}.wasm'

if __name__ == '__main__':
    raise RuntimeError(
        'This is a module, not a script. Did you mean to run ts-defs.py?'
    )
