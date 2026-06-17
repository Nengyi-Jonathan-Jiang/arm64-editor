import os, errno

from helpers.files import *


def remove_silent(filename: str) -> None:
    try:
        os.remove(filename)
    except OSError as e:
        if e.errno != errno.ENOENT:
            raise


remove_silent(file_wasm_debug)
remove_silent(file_wasm_decompiled)
remove_silent(file_wasm_temp)
remove_silent(file_wasm)
remove_silent(file_ts_defs)
