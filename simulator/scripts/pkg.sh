# shellcheck disable=SC2012
dir="./pkg"
unoptimized="$dir/simulator.unoptimized.wasm"
temp="$dir/temp.wasm"
dest="$dir/simulator.wasm"

set -o pipefail
if ls -t target/wasm32-unknown-unknown/**/simulator.wasm \
    | head -n 1 \
    | xargs -I{} cp {} "$temp"
then
    cp -f "$temp" "$unoptimized"

    echo "Optimizing wasm"
    wasm-opt -O "$temp" -o "$temp"
    wasm-strip "$temp"
    mv -f "$temp" "$dest"
else
    echo "Could not do optimizing pass"
fi