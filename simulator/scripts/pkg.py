import os, shutil, sys, subprocess
from glob import glob

from helpers.files import *

print("Copying build output")

files = glob(file_glob_rust_build)
if len(files) == 0:
    print("Could not find WASM build output. "
          "Did you build for wasm32-unknown-unknown?", file=sys.stderr)
    exit(1)

files.sort(key=lambda file: os.path.getmtime(file), reverse=True)

shutil.copyfile(files[0], file_wasm_debug)

print("Optimizing wasm")

subprocess.run(['wasm-opt', file_wasm_debug, '-g', '-O4', '-o', file_wasm_debug])
shutil.copyfile(file_wasm_debug, file_wasm_temp)
subprocess.run(['wasm-strip', file_wasm_temp])

shutil.move(file_wasm_temp, file_wasm)