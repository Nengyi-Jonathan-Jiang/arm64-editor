import type { ReactNode } from "react";

import "./codeEditor.css"

function getAffectedRange(
    s: string, left: number, right: number
): { left: number, right: number, s: string } {
    [left, right] = [s.lastIndexOf("\n", left - 1) + 1, s.indexOf("\n", right)];
    return { left, right, s: s.substring(left, right) };
}
function sortRange(
    a: number, b: number
): [number, number, "forward" | "backward"] {
    return a > b ? [b, a, "backward"] : [a, b, "forward"];
}

export function CodeEditor({ value, setValue, errors, placeholder, Highlighter }: {
    value: string;
    setValue: (code: string) => void;
    errors?: Map<number, string[]>,
    placeholder?: string,
    Highlighter: (props: { value: string, errors: Map<number, string[]> }) => ReactNode
}) {
    errors ??= new Map;

    return <div className="code-editor">
        <textarea className="code-input"
            spellCheck="false"
            placeholder={placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
                const { currentTarget: i, key, shiftKey: shift, ctrlKey: ctrl } = e;
                const {
                    selectionStart: oldLeft,
                    selectionEnd: oldRight,
                    selectionDirection: direction,
                    value
                } = i;
                const wasCollapsed = oldLeft === oldRight;
                const oldStart = direction === "backward" ? oldRight : oldLeft;
                const oldEnd = direction === "backward" ? oldLeft : oldRight;

                if (key === 'Tab') {
                    e.preventDefault();

                    const { left, right, s } = getAffectedRange(
                        value, oldLeft, oldRight
                    );

                    // Insert tab
                    if (!shift && wasCollapsed) {
                        document.execCommand("insertText", false, " ".repeat(
                            4 - ((i.selectionStart - left) & 3)
                        ));
                        return;
                    }
                    // Indent/dedent
                    i.setSelectionRange(left, right);
                    const replacement = shift ?
                        s.replaceAll(/(^( {4})*) {1,4}/gm, "$1") :
                        s.replaceAll(/(^( {4})*) {0,3}/gm, "$1    ");
                    document.execCommand("insertText", false, replacement);
                    i.setSelectionRange(
                        left, left + replacement.length,
                        direction
                    );
                }
                if ((key === '/' || key === '?') && ctrl) {
                    e.preventDefault();

                    const { left, right, s } = getAffectedRange(
                        i.value, oldLeft, oldRight
                    );

                    const commentedStates = new Set(s
                        .split('\n')
                        .map(i => !!i.match(/^ *\/\//))
                    );
                    const doUncomment = commentedStates.size == 2
                        ? shift // If mixed, disambiguate by shift key
                        : [...commentedStates][0]

                    i.setSelectionRange(left, right);
                    const replacement = doUncomment ?
                        s.replaceAll(/(^ *)\/\/ ?/gm, "$1") :
                        s.replaceAll(/(^ *)(?! *\/\/)/gm, "$1// ");
                    document.execCommand("insertText", false, replacement);
                    i.setSelectionRange(
                        left, left + replacement.length,
                        direction
                    );
                    return;
                }
                if (key === 'Home') {
                    e.preventDefault();
    
                    const { left, s } = getAffectedRange(
                        i.value, oldEnd, oldEnd
                    );

                    let target = left + s.match(/^ */)![0].length;
                    console.log(oldEnd, left, target, direction);
                    if (oldEnd === target) {
                        target = left;
                    }
                    i.setSelectionRange(
                        ...sortRange(shift ? oldStart : target, target)
                    );
                    // TODO: Scroll to beginning
                }
                // if (key === 'End') {
                //     e.preventDefault();
                //     const smartEndIndex = left + s.match(/ *$/)!.index!;
                //     if (wasCollapsed && oldLeft === smartEndIndex) {
                //         i.setSelectionRange(right, right);
                //     }
                //     else {
                //         i.setSelectionRange(smartEndIndex, smartEndIndex);
                //     }
                //     // TODO: Scroll to end
                // }
            }}
        />
        <div className="code-overlay">
            <Highlighter errors={errors} value={value} />
        </div>
    </div>
}