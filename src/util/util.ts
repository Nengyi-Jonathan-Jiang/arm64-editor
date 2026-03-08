export function wrapUndef<T>(
    x: T | undefined
): [] | [T];
export function wrapUndef<T, U>(
    x: T | undefined, f: (x: T) => U
): [] | [U];
export function wrapUndef(
    x: any, f ?: (x: any) => any
): any {  
    return x === undefined ? [] : [f ? f(x) : x];
}

function randUnsignedBigintBytes(numBytes: number): bigint {
    if (numBytes === 1) {
        return BigInt(~~(Math.random() * 256));
    }
    return new Array(numBytes)
        .fill(null)
        .map((_, i) => randUnsignedBigintBytes(1) << BigInt(i << 3))
        .reduce((a, b) => a + b);
}

(window as any)['randB'] = randUnsignedBigintBytes

/** Generate a random BigInt with the given number of bits */
export function randUnsignedBigint(numBits: number): bigint {
    const res = randUnsignedBigintBytes((numBits + 7) >> 3);
    return res & ((1n << BigInt(numBits)) - 1n);
}

export function toHexString(n: number | bigint, bytes: number) {
    return n.toString(16).padStart(bytes * 2, '0');
}

// Common BigInts

/** 2^7 */
export const BigInt7 = 1n << 7n;
/** 2^8 */
export const BigInt8 = 1n << 8n;
/** 2^8 - 1 */
export const BigInt8Mask = BigInt8 - 1n;
/** 2^15 */
export const BigInt15 = 1n << 15n;
/** 2^16 */
export const BigInt16 = 1n << 16n;
/** 2^16 - 1 */
export const BigInt16Mask = BigInt16 - 1n;
/** 2^31*/
export const BigInt31 = 1n << 31n;
/** 2^32 */
export const BigInt32 = 1n << 32n;
/** 2^32 - 1 */
export const BigInt32Mask = BigInt32 - 1n;
/** 2^63 */
export const BigInt63 = 1n << 63n;
/** 2^64 */
export const BigInt64 = 1n << 64n;
/** 2^64 - 1 */
export const BigInt64Mask = BigInt64 - 1n;