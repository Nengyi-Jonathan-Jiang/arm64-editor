# shellcheck disable=SC2012
dir="./pkg"
debug="$dir/simulator.debug.wasm"
temp="$dir/temp.wasm"
dest="$dir/simulator.wasm"

echo "Copying build output"
set -o pipefail
if ls -t target/wasm32-unknown-unknown/**/simulator.wasm \
    | head -n 1 \
    | xargs -I{} cp {} "$temp"
then
    echo "Optimizing wasm"

    wasm-opt "$temp" -g -Os -o "$temp"
    cp -f "$temp" "$debug"
    wasm-strip "$temp"

    mv -f "$temp" "$dest"
else
    echo "Could not do optimizing pass"
fi