import { useState, type ReactNode } from "react";
import { CodeEditor } from "./codeEditor/codeEditor";
import type { Register, State } from "./chArm/state";

import "./inputsEditor.css"

export function InputsEditor(
    { setFunc: _setFunc }: { setFunc: (f: (s: State) => any) => any }
): ReactNode {
    const [inputsCode, setInputsCode] = useState("");

    // Tokenize input
    type Token = { type: string, s: string, error?: boolean } & (
        { type: "regkwd" } |
        { type: "reg", register: Register } |
        { type: "size", size: 8 | 16 | 32 | 64 } |
        { type: "value", value: bigint } |
        { type: "label", value: string } |
        { type: "comment" } |
        { type: "whitespace" } |
        { type: "error" }
    );
    const tokens: Token[] = [];
    // type Action = never;
    // const labels: Map<string, (i: number) => void>
    // const actions: Action[];
    // const currOffset: bigint = 0n;
    for (let line of inputsCode.split(/(?<=\n)/g)) {
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
                    register: (m[1] ? +m[1] : m[2]) as never
                };
            }
            else if (m = word.match(/^i(8|16|32|64)$/)) {
                currToken = { type: "size", s, size: +m![0] as never }
            }
            else if (word === "reg") {
                currToken = { type: "regkwd", s }
            }
            else if (m = word.match(/^(-?)([\d_]+|0b[01_]+|0x[\da-f_]+)$/)) {
                currToken = {
                    type: "value", s, value:
                        (m[1] ? -1n : 1n) * BigInt(m[2])
                }
            }
            else if (m = word.match(/^(\.?[a-z_]\w*):?$/)) {
                currToken = { type: "label", s, value: m[1] }
            }
            else {
                currToken = { type: "error", s }
            }
            tokens.push(currToken);
        }
    }

    return <CodeEditor
        value={inputsCode}
        setValue={setInputsCode}
        Highlighter={() => <pre>
            {tokens.map((t, i) => {
                const { type, s } = t;
                return type === "whitespace"
                    ? s
                    : <span className={type} key={i}>{s}</span>
            })}
        </pre>}
        placeholder={
            `
            // Inputs go here! For example
            // i16 264 i16 0b01001100001111
            // reg x0 i64 21
            // reg x1 ptr
            // i32 0xdeadbeef
            // ptr: i8 34 i8 0 i8 0 i8 0
            // i32 0xdeadbeef
            `.trim().split('\n').map(i => i.trim()).join('\n')
        }
    />
}