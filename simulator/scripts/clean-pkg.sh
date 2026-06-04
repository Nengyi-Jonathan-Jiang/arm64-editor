maybe_rm () {
  echo "$1"
  [ -f "$1" ] && rm "$1"
}

maybe_rm "./pkg/simulator.unoptimized.wasm"
maybe_rm "./pkg/simulator.wasm"
maybe_rm "./pkg/simulator.d.ts"