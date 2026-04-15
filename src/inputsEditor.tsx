import { type ReactNode, useEffect, useMemo, useState } from "react";
import { CodeEditor } from "./codeEditor/codeEditor";
import { type Register, type RegisterGP, State } from "./chArm/state";

import "./inputsEditor.css";
import { cast } from "./util/util.ts";

type IntSize = 8n | 16n | 32n | 64n;
type Token = { type: string, s: string, error?: boolean } & (
    { type: "reg", register: RegisterGP } |
    { type: "size", size: IntSize } |
    { type: "value", value: bigint } |
    { type: "labelDec", value: string } |
    { type: "labelRef", value: string } |
    { type: "comment" } |
    { type: "whitespace" } |
    { type: "error" }
    );

const initialCode: string = `
    // Inputs go here! For example
    i16 264 i16 0b01001100001111
    x0 21
    x1 ptr
    i32 0xdeadbeef
    ptr: i8 34 i8 0 i8 0 i8 0
    i32 0xdeadbeef
`.trim().replaceAll(/\s*\n\s*/g, '\n');

export function InputsEditor (
    { setFunc }: { setFunc: (f: () => State) => any },
): ReactNode {

    const [ inputsCode, setInputsCode ] = useState(initialCode);
    const tokens = useMemo(() => tokenize(inputsCode), [ inputsCode ]);

    useEffect(
        () => {
            setFunc(parse(tokens));
        }, [
            JSON.stringify(
                tokens,
                (_, x) => typeof x === 'bigint' ? x.toString() : x, 0,
            ),
        ],
    );

    return <CodeEditor
        value={ inputsCode }
        setValue={ setInputsCode }
        Highlighter={ () => <pre>
            { tokens.map((t, i) => {
                const { type, s } = t;
                return type === "whitespace"
                    ? s
                    : <span className={ type + (t.error ? ' error' : '') }
                            key={ i }>{ s }</span>;
            }) }
        </pre> }
        placeholder={ initialCode }
    />;
}

function tokenize (s: string): readonly Token[] {
    const tokens: Token[] = [];
    for (let line of s.split(/(?<=\n)/g)) {
        if (line.match(/^ *\/\//)) {
            tokens.push({ type: "comment", s: line });
            continue;
        }
        while (true) {
            const whiteSpace = line.match(/^\s*/)?.[0] ?? "";
            if (whiteSpace) {
                line = line.substring(whiteSpace.length);
                tokens.push({ type: "whitespace", s: whiteSpace });
            }
            const s = line.match(/^\S+/)?.[0];
            if (!s) break;
            line = line.substring(s.length);
            const word = s.toLowerCase();

            let currToken: Token;
            let m: RegExpMatchArray | null;
            if (m = word.match(/^x(?:([12]?\d|30)|(sp|zr))$/)) {
                currToken = {
                    type: 'reg', s,
                    register: (m[1] ? +m[1] : m[2]) as never,
                };
            }
            else if (m = word.match(/^i(8|16|32|64)$/)) {
                currToken = { type: "size", s, size: cast(BigInt(m![1])) };
            }
            else if (m = word.match(/^(-?)([\d_]+|0b[01_]+|0x[\da-f_]+)$/)) {
                currToken = {
                    type: "value", s, value:
                          (m[1] ? -1n : 1n) * BigInt(m[2]),
                };
            }
            else if (m = word.match(/^(\.?[a-z_]\w*):$/)) {
                currToken = { type: "labelDec", s, value: m[1] };
            }
            else if (m = word.match(/^(\.?[a-z_]\w*)$/)) {
                currToken = { type: "labelRef", s, value: m[1] };
            }
            else {
                currToken = { type: "error", s };
            }
            tokens.push(currToken);
        }
    }

    return tokens;
}

function parse (tokens: readonly Token[]): () => State {
    type Value = bigint | string;

    const labelPositions = new Map<string, bigint>;
    const registers = new Map<Register, Value>;
    const memory: { offset: bigint, size: IntSize, value: Value }[] = [];

    let currOffset: bigint = 0n;
    let currState: null | IntSize | RegisterGP = null;
    let lastToken: Token | null = null;
    for (const token of tokens) {
        switch (token.type) {
            // @ts-ignore
            case "value":
                token.value &= (1n << (typeof currState === "bigint"
                    ? currState
                    : 64n)) - 1n;
            case "labelRef":
                if (currState === null) {
                    token.error = true;
                    break;
                }
                if (typeof currState === "bigint") {
                    memory.push({
                        offset: currOffset,
                        size:   currState,
                        value:  token.value,
                    });

                    currOffset += currState;
                }
                else {
                    registers.set(currState, token.value);
                }
                currState = null;
                lastToken = token;
                break;
            case "reg":
                if (lastToken && currState !== null) lastToken.error = true;
                currState = token.register;
                lastToken = token;
                break;
            case "size":
                if (lastToken && currState !== null) lastToken.error = true;
                currState = token.size;
                lastToken = token;
                break;
            case "labelDec":
                if (lastToken && currState !== null) lastToken.error = true;
                labelPositions.set(token.value, currOffset);
                lastToken = token;
                break;
        }
    }
    if (lastToken && currState !== null) {
        lastToken.error = true;
    }

    return () => {
        const state = State.new();

        const data = new Uint8Array(Number(currOffset));
        const dataView = new DataView(data.buffer);

        for (const { offset, value, size } of memory) {
            const actualValue = typeof value === 'bigint'
                ? value
                : (labelPositions.get(value) ?? 0n) + state.memOffset;

            switch (size) {
                case 8n:
                    dataView.setUint8(Number(offset), Number(actualValue));
                    break;
                case 16n:
                    dataView.setUint16(Number(offset), Number(actualValue));
                    break;
                case 32n:
                    dataView.setUint32(Number(offset), Number(actualValue));
                    break;
                case 64n:
                    dataView.setBigUint64(Number(offset), actualValue);
                    break;

            }
        }

        state.reset(data);

        for (let [ register, value ] of registers) {
            state.setRegister(
                register,
                typeof value === 'bigint'
                    ? value
                    : (labelPositions.get(value) ?? 0n) + state.memOffset,
            );
        }

        return state;
    };
}
