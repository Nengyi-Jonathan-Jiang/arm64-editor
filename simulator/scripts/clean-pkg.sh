maybe_rm () {
  echo "$1"
  [ -f "$1" ] && rm "$1"
}

maybe_rm "./pkg/simulator.debug.wasm"
maybe_rm "./pkg/simulator.wasm.decompiled.txt"
maybe_rm "./pkg/simulator.wasm"
maybe_rm "./pkg/simulator.d.ts"