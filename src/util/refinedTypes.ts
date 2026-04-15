export type char = string & { length: 1 };
export type chars = Iterable<char>;

export function isChar (s: string): s is char {
    return s.length === 1;
}

declare const int_tag: unique symbol;
export type int = number & { [int_tag]: undefined }

export function isInt (s: number): s is int {
    return s >= Number.MIN_SAFE_INTEGER
        && s <= Number.MAX_SAFE_INTEGER
        && s == ~~s;
}