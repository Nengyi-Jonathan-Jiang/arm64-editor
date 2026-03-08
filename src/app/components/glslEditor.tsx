import {GLSLHighlighter} from "@/app/components/glslHighlighter";

import "./glslEditor.css";
import {CodeEditor} from "@/codeEditor/codeEditor";
import {Fragment, ReactElement} from "react";

export function ShaderCodeEditor({mainCode, setMainCode, headerCode, errors, buttons}: {
    mainCode: string,
    setMainCode: (mainCode: string) => void,
    headerCode: string,
    errors: Map<number, string[]>,
    buttons: ReactElement[],
}) {
    const headerCodeErrors = new Map<number, string[]>;
    const mainCodeErrors = new Map<number, string[]>;

    const numHeaderCodeLines = [...headerCode.matchAll(/\n/g)].length + 1;
    for (const [line, lineErrors] of errors ?? new Map) {
        if (line < numHeaderCodeLines) {
            headerCodeErrors.set(line, lineErrors);
        }
        else {
            mainCodeErrors.set(line - numHeaderCodeLines, lineErrors);
        }
    }

    return <div id="code-container" className="code">
        <div style={{
            width: "fit-content",
            minWidth: "100%",
            flexGrow: "1",
            display: "flex",
            flexDirection: "column"
        }}>
            <div id="code-header">
                <GLSLHighlighter errors={headerCodeErrors} value={headerCode}/>
            </div>
            <div id="code-body">
                <CodeEditor value={mainCode} setValue={setMainCode} errors={mainCodeErrors}
                            Highlighter={GLSLHighlighter}/>
            </div>
        </div>
        <div id="bottom-buttons">
            {
                new Array(buttons.length * 2 - 1).fill(null).map((_, i) => <Fragment key={i}>
                    {
                        i % 2 === 0 ? buttons[i / 2] : <div className='button-divider'/>
                    }
                </Fragment>)
            }
        </div>
    </div>
}