import React, {ReactNode, useRef, useState} from "react";
import {useListenerOnWindow} from "@/util/hooks";
import './resizable.css';

export function HorizontalResizableDoublePane({left, right}: { left: ReactNode, right: ReactNode }): ReactNode {
    const isResizerActive = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const setResizerActive = (active: boolean) => isResizerActive.current = active;
    const [resizerPercentage, setResizerPercentage] = useState(50);

    useListenerOnWindow("mousemove", ({clientX}) => {
        if (isResizerActive.current && containerRef.current) {
            const boundingRect = containerRef.current.getBoundingClientRect();
            setResizerPercentage(100 * (clientX - boundingRect.left) / boundingRect.width);
            window?.getSelection()?.removeAllRanges();
        }
    });
    useListenerOnWindow("mouseup", setResizerActive.bind(null, false));
    useListenerOnWindow("blur", setResizerActive.bind(null, false));

    return <div className='horizontal resizable-panes-container' ref={containerRef}>
        <div className='resizable-pane' style={{width: `${resizerPercentage}%`}}>
            {left}
        </div>
        <div className="resizer" onMouseDown={setResizerActive.bind(null, true)}/>
        <div className='resizable-pane' style={{width: `${100 - resizerPercentage}%`}}>
            {right}
        </div>
    </div>
}

export function VerticalResizableDoublePane({top, bottom}: { top: ReactNode, bottom: ReactNode }): ReactNode {
    const isResizerActive = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const setResizerActive = (active: boolean) => isResizerActive.current = active;
    const [resizerPercentage, setResizerPercentage] = useState(50);

    useListenerOnWindow("mousemove", ({clientY}) => {
        if (isResizerActive.current && containerRef.current) {
            const boundingRect = containerRef.current.getBoundingClientRect();
            setResizerPercentage(100 * (clientY - boundingRect.top) / boundingRect.height);
            window?.getSelection()?.removeAllRanges();
        }
    });
    useListenerOnWindow("mouseup", setResizerActive.bind(null, false));
    useListenerOnWindow("blur", setResizerActive.bind(null, false));

    return <div className='vertical resizable-panes-container' ref={containerRef}>
        <div className='resizable-pane' style={{height: `${resizerPercentage}%`}}>
            {top}
        </div>
        <div className="resizer" onMouseDown={setResizerActive.bind(null, true)}/>
        <div className='resizable-pane' style={{height: `${100 - resizerPercentage}%`}}>
            {bottom}
        </div>
    </div>
}