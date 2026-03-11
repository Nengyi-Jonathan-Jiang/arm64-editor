import type { ReactNode } from "react";
import { getTokenContents, type Token } from "../chArm/tokenizer";
import { splitWhitespace } from "../util/util";

function splitString(str: string, key: string): ReactNode[] {
    const [a, b, c] = splitWhitespace(str);
    return [
        ...(!a ? [] : [a]),
        ...(!b ? [] : [<span className="error" key={key}>{b}</span>]),
        ...(!b ? [] : [c]),
    ];
}

export function CodeHighlighter({ value, tokens }: {
    value: string,
    tokens: readonly Token[]
}): ReactNode {
    const elements: ReactNode[] = [];

    let currentIndex = 0;
    let currentToken = 0;
    for (const token of tokens) {
        const before = value.substring(currentIndex, token.originalRange[0]);
        currentIndex = token.originalRange[1];

        elements.push(...splitString(
            before,
            `${currentToken}|${elements.length}`
        ));
        elements.push(
            <span className={
                token.type + (token.isError ? " error" : "")}
                key={currentToken++}
            >
                {getTokenContents(token)}
            </span>
        );
    }
    elements.push(...splitString(value.substring(currentIndex), 'END'));

    return <pre>
        {elements}
        <span style={{ fontSize: 0, userSelect: 'none' }}>
            {' '}
        </span>
    </pre>;
}