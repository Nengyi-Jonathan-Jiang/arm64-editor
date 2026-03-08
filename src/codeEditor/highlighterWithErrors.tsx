import {ReactNode} from "react";
import "./highlighterWithErrors.css"

export function HighlighterWithErrors({children, errors}: {
    errors?: Map<number, string[]>,
    children: ReactNode
}): ReactNode {
    errors ??= new Map;

    let numLines = Math.max(...errors.keys()) + 1;
    if (!Number.isFinite(numLines)) {
        numLines = 1;
    }

    return <div className='code-highlighter-container'>
        {children}
        <div className='code-highlighter-errors'>
            {
                new Array(numLines).fill(null).map((_, i) => {
                    const lineErrors = errors.get(i);
                    if (!lineErrors) {
                        return <span className='error-line no-errors' key={i}></span>;
                    }

                    return <span className='error-line' key={i}>
                        <div className='errors'>
                            {
                                lineErrors.map((message, i) => <span key={i}>{message}</span>)
                            }
                        </div>
                    </span>;
                })
            }
        </div>
    </div>
}