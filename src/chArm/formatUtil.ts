export function formatBin (n: number | bigint, length: number, spaces = false) {
    return n.toString(2).padStart(length, spaces ? ' ' : '0');
}

export function formatHex (n: number | bigint, length: number, spaces = false) {
    return n.toString(16).padStart(length, spaces ? ' ' : '0');
}

export function formatDec (n: number | bigint, length: number, spaces = false) {
    return n.toString().padStart(length, spaces ? ' ' : '0');
}