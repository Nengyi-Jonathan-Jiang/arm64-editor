# shellcheck disable=SC2012
dir="./pkg"
unoptimized="$dir/simulator.unoptimized.wasm"
temp="$dir/temp.wasm"
dest="$dir/simulator.wasm"
decompiled="$dest.decompiled.txt"
dwarf="$dest.dwarf.txt"

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

    echo "Decompiling wasm"
    wasm-decompile "$unoptimized" > "$decompiled"
    if command -v llvm-dwarfdump >/dev/null 2>&1; then
        echo "Extracting debug info"
        llvm-dwarfdump "$unoptimized" > "$dwarf"
    fi
else
    echo "Could not do optimizing pass"
fi