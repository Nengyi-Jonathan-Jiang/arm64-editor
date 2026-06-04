import os, errno

from helpers.files import *

def remove_silent(filename):
    try:
        os.remove(filename)
    except OSError as e: # this would be "except OSError, e:" before Python 2.6
        if e.errno != errno.ENOENT: # errno.ENOENT = no such file or directory
            raise # re-raise exception if a different error occurred

remove_silent(file_wasm_unoptimized)
remove_silent(file_wasm_temp)
remove_silent(file_wasm_optimized)
remove_silent(file_ts_defs)