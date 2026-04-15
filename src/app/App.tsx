import {
    type HTMLAttributes, memo, type ReactNode, useEffect, useMemo, useState,
} from 'react';
import './App.css';
import '../chArm/parser';

import { Executor } from "../chArm/execute.ts";
import { State } from "../chArm/state.ts";

import { CodeEditor } from '../codeEditor/codeEditor';
import { CodeHighlighter } from '../codeEditor/codeHighlighter';
import { HighlighterWithErrors } from '../codeEditor/highlighterWithErrors';
import { HorizontalPanels, VerticalPanels } from '../resizable/resizable';
import { useListenerOnWindow, useManualRerender } from '../util/hooks';
import { tokenize } from '../chArm/tokenizer';
import { assembleChARM } from '../chArm/parser';
import { InputsEditor } from '../inputsEditor';
import { useSave } from "./save.ts";

function HL ({ children, color, ...attributes }: {
    children: ReactNode,
    color: "red" | "orange" | "yellow" | "green" | "cyan" | "purple" | "medium",
} & Partial<HTMLAttributes<HTMLSpanElement>>): ReactNode {
    return <span
        style={ { color: `var(--color-${ color })` } } { ...attributes }>
        { children }
    </span>;
}

const FuncNameInput = ({
    funcName,
    setFuncName,
}: { funcName: string, setFuncName: (name: string) => any }) => {
    const [ value, setValue ] = useState(funcName);
    return <input
        id="function-name"
        placeholder={ funcName }
        value={ value }
        onKeyDown={ e => {
            const { key } = e;
            if (!key.match(/^\w+$/)) { // Function name must be only word chars
                e.preventDefault();
            }
        } }
        onChange={ e => {
            const name = e.target.value;
            setValue(name);
            if (name.length >= 1) {
                setFuncName(name);
            }
        } }
        spellCheck="false"
    />;
};

const LineNumbers = memo(({ amount }: { amount: number }) => {
    const len = amount.toString().length;

    return <pre id="line-numbers">
        {
            new Array(amount).fill(0)
                .map((_, i) => i + 1)
                .map(i => `  ${ i.toString().padStart(len, ' ') } `)
                .join('\n')
        }
    </pre>;
});

export function App () {
    const save = useSave('Code');

    const [ funcName, setFuncName ] = save.useSaved<string>('funcName', 'func');
    const [ code, setCode ] = save.useSaved<string>('src', '    ret');
    const [ initialState, setInitialState ] = useState(
        () => () => State.new(),
    );
    const rerender = useManualRerender();

    useEffect(() => {
        document.title = (save.hasUnsavedChanges ? "*" : "") + "arm64-editor";
    }, [ code, funcName ]);

    useListenerOnWindow({
        listenerType: "keydown", listener: e => {
            if (e.ctrlKey && e.key.toLowerCase() === 's') {
                localStorage.setItem("src", code);
                localStorage.setItem("func", funcName);
                document.title = "arm64-editor";
                e.preventDefault();

                save.saveToStorage();

                rerender();
            }
        },
    }, [ code, funcName ]);

    const tokenized = useMemo(() => tokenize(code), [ code ]);
    const [ instructions, _lineNumbers, errors ] = useMemo(
        () => assembleChARM(tokenized, funcName), [ tokenized, funcName ],
    );
    (window as any)['instructions'] = instructions;

    const executor = useMemo(() => new Executor(State.new(), instructions), []);

    return <HorizontalPanels left={
        <div id="asm-editor-outer">
            <LineNumbers amount={ code.split('\n').length + 6 }/>
            <div id="asm-editor">
                <pre>
                    <span className="tab-line"/>
                    <HL color="cyan" children={ "    .align   " }/>
                    <HL color="purple" children={ "2\n" }/>
                    <span className="tab-line"/>
                    <HL color="cyan" children={ "    .p2align " }/>
                    <HL color="purple" children={ "3" }/>
                    <HL color="medium" children={ ",," }/>
                    <HL color="purple" children={ "7\n" }/>
                    <span className="tab-line"/>
                    <HL color="cyan" children={ "    .global  " }/>
                    <HL color="green" children={ `${ funcName }\n` }/>
                    <span className="tab-line"/>
                    <HL color="cyan" children={ "    .type    " }/>
                    <HL color="green" children={ `${ funcName }` }/>
                    <HL color="medium" children={ "," }/>
                    <HL color="orange" children={ " %function\n" }/>
                    <FuncNameInput funcName={ funcName }
                                   setFuncName={ setFuncName }/>
                    <HL color="green" children={ ":" } onClick={
                        ({ currentTarget: { previousElementSibling: i } }) => {
                            (i as HTMLInputElement).focus();
                        } }/>
                </pre>
                <CodeEditor
                    value={ code }
                    setValue={ (code: string) => {
                        setCode(code);
                    } }
                    errors={ errors }
                    Highlighter={ ({ value, errors }) => {
                        return <HighlighterWithErrors errors={ errors }>
                            <CodeHighlighter value={ value }
                                             tokens={ tokenized }/>
                        </HighlighterWithErrors>;
                    } }/>
                <pre>
                    <span className="tab-line"/>
                    <HL color="cyan" children={ "    .size    " }/>
                    <HL color="green" children={ `${ funcName }` }/>
                    <HL color="medium" children={ ", .-" }/>
                    <HL color="green" children={ `${ funcName }` }/>
                </pre>
            </div>
        </div>
    } right={
        <VerticalPanels top={
            <div style={ { overflowY: 'scroll', padding: '.5em' } }>
                <div id="run-controls">
                    <button
                        onClick={
                            () => {
                                executor.reset(initialState(), instructions);
                                rerender();
                            }
                        }
                    >Reload
                    </button>
                    { " " }
                    <button
                        onClick={
                            () => {
                                executor.step();
                                rerender();
                            }
                        }
                    >Step
                    </button>
                </div>
                <pre>
                    {
                        JSON.stringify(
                            executor.termination
                                ? executor.termination.toString()
                                : executor.currInstruction
                            , (
                                (_, x) => (typeof x === "bigint")
                                    ? x.toString()
                                    : x
                            ), 0,
                        )
                    }
                    { "\n" }
                    {
                        executor.state.DEBUG_registersAsStr()
                    }
                    { "\n" }
                    {
                        executor.state.DEBUG_memoryAsStr()
                    }
                </pre>
            </div>
        } bottom={
            <div id="inputs-editor" style={ { overflowY: 'scroll' } }>
                <InputsEditor save={ save }
                              setFunc={ f => setInitialState(() => f) }/>
            </div>
        }/>
    }/>;

}