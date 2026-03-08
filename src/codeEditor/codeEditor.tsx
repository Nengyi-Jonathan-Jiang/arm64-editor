import {ReactNode} from "react";

import "./codeEditor.css"

export function CodeEditor({value, setValue, errors, placeholder, Highlighter}: {
    value: string;
    setValue: (code: string) => void;
    errors?: Map<number, string[]>,
    placeholder?: string,
    Highlighter: (props: { value: string, errors: Map<number, string[]> }) => ReactNode
}) {
    errors ??= new Map;

    return <div className="code-editor">
        <div className="code-overlay">
            <Highlighter errors={errors} value={value}/>
        </div>
        <textarea className="code-input"
                  spellCheck="false"
                  placeholder={placeholder}
                  value={value} onChange={e => setValue(e.target.value)}/>
    </div>
}