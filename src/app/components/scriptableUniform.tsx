import {ShaderCanvasUniformTypeMap} from "@/app/webgl/ShaderCanvas";
import React, {ReactNode} from "react";
import {JSHighlighter} from "@/app/components/jsHighlighter";
import {Select} from "@/util/select";
import {CodeEditor} from "@/codeEditor/codeEditor";
import {evalStatementsInContext} from "@/eval/eval";
import {ScriptableUniformData, ScriptableUniformType, scriptableUniformTypes} from "@/app/data/scriptableUniformData";

export abstract class ScriptableUniform {
    protected _shaderUniformCallback: ShaderUniformCallback | null = null;

    public abstract get name(): string;

    public abstract get type(): ScriptableUniformType;

    public abstract get id(): number ;

    public abstract get periodicSrc(): string;

    public abstract get initSrc(): string;

    public get shaderUniformCallback(): ShaderUniformCallback | null {
        return this._shaderUniformCallback;
    }

    protected get combinedSource() {
        return `${
            this.initSrc
        }\nregisterUniform("${
            this.name
        }", "${
            this.type
        }", (canvas, time, mouse) => {\n${
            this.periodicSrc
        }\n});`
    }

    public evaluateSource() {
        try {
            evalStatementsInContext(this.combinedSource, {
                registerUniform: (
                    _: any,
                    __: any,
                    callBack: ShaderUniformCallback
                ) => {
                    this._shaderUniformCallback = callBack;
                },
                ...Object.fromEntries(Object.getOwnPropertyNames(Math).map(i => [i, (Math as any)[i]]))
            });
        } catch (e) {
            console.error(e);
            alert(`Error running uniform code for "${this.name}" :\n${e}`);
            this._shaderUniformCallback = null;
        }
    }

    public static Renderer({data, rerender}: { data: ScriptableUniform, rerender: () => void }) {
        return <div className="uniforms-editor-tab-content"
                    data-disabled={data instanceof EditableScriptableUniform ? null : ""}>
            <div className="uniforms-editor-tab-top">
            <span><span>Name: </span>
                {data.renderName({rerender})}
            </span>
                <span>Type:&nbsp;</span>
                <span className="uniform-type-select">
                {data.renderType({rerender})}
            </span>
                {data.renderRunButton()}
            </div>
            <div className='js'>
                {data.renderInitSrc({rerender})}
                <JSHighlighter value={
                    `registerUniform("${data.name}", "${data.type}", (canvas, time, mouse) => {`
                }/>
                {data.renderPeriodicSrc({rerender})}
                <JSHighlighter value='});'/>
            </div>
        </div>
    }

    protected abstract renderInitSrc({rerender}: { rerender: () => void }): ReactNode;

    protected abstract renderPeriodicSrc({rerender}: { rerender: () => void }): ReactNode;

    protected abstract renderRunButton(): ReactNode;

    protected abstract renderName({rerender}: { rerender: () => void }): ReactNode;

    protected abstract renderType({rerender}: { rerender: () => void }): ReactNode;
}

export class ReadonlyScriptableUniform extends ScriptableUniform {
    public readonly name: string;
    public readonly type: ScriptableUniformType;
    public readonly initSrc: string;
    public readonly periodicSrc: string;
    public readonly id: number;

    constructor(id: number, name: string, type: ScriptableUniformType, initSrc: string, periodicSrc: string) {
        super();
        this.id = id;
        this.name = name;
        this.type = type;
        this.initSrc = initSrc;
        this.periodicSrc = periodicSrc;
    }

    public renderInitSrc(): ReactNode {
        return <JSHighlighter value={this.initSrc}/>;
    }

    public renderPeriodicSrc(): ReactNode {
        return <JSHighlighter value={this.periodicSrc}/>;
    }

    public renderRunButton(): ReactNode {
        return null;
    }

    public renderName(): ReactNode {
        return <input value={this.name} readOnly tabIndex={-1}/>
    }

    public renderType(): ReactNode {
        return <Select onChange={() => void 0} value={this.type} options={[this.type]} disabled={true}/>
    }
}

export class EditableScriptableUniform extends ScriptableUniform {
    protected data: ScriptableUniformData;

    public get name() {
        return this.data.name;
    }

    public get type() {
        return this.data.type;
    }

    public get id() {
        return this.data.id;
    }

    public get periodicSrc(): string {
        return this.data.periodicSrc;
    }

    public get initSrc(): string {
        return this.data.initSrc;
    }

    public set name(name: string) {
        this.data.name = name;
    }

    public set type(type: ScriptableUniformType) {
        this.data.type = type;
    }

    public set periodicSrc(value: string) {
        this.data.periodicSrc = value;
    }

    public set initSrc(value: string) {
        this.data.initSrc = value;
    }

    constructor(
        name?: string,
        type: ScriptableUniformType = 'float',
        initSrc: string = '// Initialization code here...',
        periodicSrc: string = '    return 0;'
    ) {
        super();
        this.data = new ScriptableUniformData(name, type, initSrc, periodicSrc);
    }

    public renderInitSrc({rerender}: { rerender: () => void }): React.ReactNode {
        return <CodeEditor value={this.initSrc} setValue={(value) => {
            this.initSrc = value;
            rerender();
        }} Highlighter={JSHighlighter}/>;
    }

    public renderPeriodicSrc({rerender}: { rerender: () => void }): ReactNode {
        return <CodeEditor value={this.periodicSrc} setValue={(value) => {
            this.periodicSrc = value;
            rerender();
        }} Highlighter={JSHighlighter}/>
    }

    public renderRunButton(): ReactNode {
        return <button onClick={() => this.evaluateSource()}>{"Run |>"}</button>;
    }

    public renderName({rerender}: { rerender: () => void; }): ReactNode {
        return <input value={this.name} onChange={({target: {value}}) => {
            this.name = value.replaceAll(/\W/g, '');
            rerender();
        }} onBlur={() => {
            if (this.name.length === 0) {
                this.name = 'var' + this.id;
                rerender();
            }
        }} spellCheck={false}/>;
    }

    public renderType({rerender}: { rerender: () => void; }): ReactNode {
        return <Select onChange={(value) => {
            this.type = value;
            rerender();
        }} value={this.type} options={scriptableUniformTypes}/>
    }
}

type ShaderUniformCallback = (
    canvas: { width: number, height: number },
    time: number,
    mouse: { position: readonly [number, number], buttons: number }
) => ShaderCanvasUniformTypeMap[ScriptableUniformType];