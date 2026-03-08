"use client"

import "./page.css";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {HorizontalResizableDoublePane, VerticalResizableDoublePane} from "@/resizable/resizable";
import {ShaderCodeEditor} from "@/app/components/glslEditor";
import {ShaderCanvas, ShaderCanvasUniformData} from "@/app/webgl/ShaderCanvas";
import {ScriptableUniformsEditor} from "@/app/components/scriptableUniformsEditor";
import {useListenerOnWindow, useManualRerender} from "@/util/hooks";
import {ReadonlyScriptableUniform} from "@/app/components/scriptableUniform";
import {providedCode} from "@/app/shaderProvidedFunctions";

const vertShader = `#version 300 es
layout (location = 0) in vec2 a_position;
uniform mediump float aspectRatio;
out vec2 fragCoord;

void main(){
    gl_Position = vec4(a_position, 1.0, 1.0);
    fragCoord = vec2(1.0 / aspectRatio, 1.0) * a_position;
}`;

const defaultMainCode = `void main(){
    fragColor = vec4(0.5 + 0.5 * cos(fragCoord.xyx + vec3(0,2,4)), 1.0);
}`

const builtinUniformData = [
    new ReadonlyScriptableUniform(
        -1,
        "aspectRatio", "float",
        "// This is a built in uniform",
        "    // canvas is a {width: number, height:number} describing the current size of the output window.\n\n    return canvas.height / canvas.width",
    ),
    new ReadonlyScriptableUniform(
        -2,
        "elapsedTime", "float",
        "// This is a built in uniform\nlet startTime = -1;",
        "    // time is a number describing the current time in seconds.\n\n    if(startTime == -1) {\n        startTime = time;\n    }\n    return time - startTime;"
    ),
    new ReadonlyScriptableUniform(
        -3,
        "mousePosition", "vec2",
        "// This is a built in uniform",
        "    // mouse is a {position: [number, number], buttons: number}.\n    // The position describes the position of the mouse on the\n    // canvas in the coordinate system of the shader. If the\n    // mouse is outside the canvas, this is set to [0, 0].\n\n    return mouse.position"
    ),
    new ReadonlyScriptableUniform(
        -4,
        "mouseButtons", "int",
        "// This is a built in uniform",
        "    // mouse is a {position: [number, number], buttons: number}.\n    // buttons is an integer representing the current state of\n    // the mouse buttons as given by JavaScript's\n    // MouseEvent.buttons\n\n    return mouse.buttons"
    ),
];
builtinUniformData.forEach(i => i.evaluateSource());

function generateHeaderCodeForUniforms(uniformsEditor: ScriptableUniformsEditor) {
    return `#version 300 es\nprecision mediump float;\nin vec2 fragCoord;\nout vec4 fragColor;\n\n${
        uniformsEditor.data.map(({name, type}) => `uniform ${type} ${name};`).join('\n')
    }\n`;
}

export default function Home() {
    const rerender = useManualRerender();

    const shaderCanvas = useMemo(() => new ShaderCanvas(), []);

    const uniformsEditor = useMemo(() => {
        const editor = new ScriptableUniformsEditor();
        for (const i of builtinUniformData) {
            editor.addDirect(i);
        }
        return editor;
    }, []);

    const [mainCode, setMainCode] = useState(defaultMainCode);
    const headerCode = generateHeaderCodeForUniforms(uniformsEditor);

    const exportCanvas = useMemo(() => (download = false) => {
        // Force a new draw to make sure the canvas doesn't get cleared before we get the download
        shaderCanvas.draw();
        shaderCanvas.canvasElement.toBlob(blob => {
            if (blob === null) {
                alert('Could not download canvas');
                return;
            }
            const dummy = document.createElement('a');
            dummy.href = URL.createObjectURL(blob);
            if (download) {
                console.log('download');
                dummy.download = 'shader_creation.png';
            }
            else {
                console.log('not download')
                dummy.target = '_blank';
            }
            dummy.click();
        })
    }, [shaderCanvas]);

    useListenerOnWindow('keydown', useMemo(() => (e: KeyboardEvent) => {
        if (!e.ctrlKey || e.key.toLowerCase() !== 'e') return;
        e.preventDefault();
        exportCanvas(e.shiftKey);
    }, []));

    // On recompile
    const startTime = useRef(-1);
    const [errors] = useState(() => new Map<number, string[]>);

    const recompile = () => {
        errors.clear();

        startTime.current = -1;
        shaderCanvas.setProgram(vertShader, headerCode + '\n' + providedCode + '\n' + mainCode);
        const numHeaderLines = headerCode.replace(/[^\n]/g, '').length + 1;
        const numBuiltinLines = providedCode.replace(/[^\n]/g, '').length + 1;

        for (let {line, message} of shaderCanvas.errors) {
            if (line >= numHeaderLines) {
                if (line >= numHeaderLines + numBuiltinLines) {
                    line -= numBuiltinLines;
                }
                else {
                    console.error(
                        `ERROR IN BUILTIN CODE @ ${line - numHeaderLines + 2}: \n${message}`
                    );
                    continue;
                }
            }

            if (!errors.has(line)) {
                errors.set(line, []);
            }
            (errors.get(line) as string[]).push(message);
        }
        rerender();
    }

    useEffect(() => {
        errors.clear();
    }, [mainCode, headerCode]);

    const getUniforms = ({canvas, currentTime, mousePosition, mouseButtonsDown}: {
        canvas: ShaderCanvas,
        currentTime: number,
        mousePosition: readonly [number, number],
        mouseButtonsDown: number
    }) => {
        if (startTime.current == -1) {
            startTime.current = currentTime;
        }

        const res: ShaderCanvasUniformData[] = [];
        uniformsEditor.data.forEach(i => {
            if (i.shaderUniformCallback !== null) {
                try {
                    const value = i.shaderUniformCallback(
                        {
                            width: canvas.width,
                            height: canvas.height,
                        }, currentTime, {
                            position: mousePosition,
                            buttons: mouseButtonsDown
                        }
                    );
                    res.push({
                        name: i.name,
                        type: i.type,
                        value
                    });
                } catch (e) {
                    return;
                }
            }
        })

        return res;
    }

    return (
        <div id="content">
            <HorizontalResizableDoublePane left={
                <VerticalResizableDoublePane top={
                    <div id='glsl-editor'>
                        <ShaderCodeEditor
                            mainCode={mainCode}
                            setMainCode={setMainCode}
                            headerCode={headerCode}
                            errors={errors}
                            buttons={[
                                <button onClick={recompile}>Run Shader</button>,
                                <button onClick={() => exportCanvas()}>Export Canvas</button>
                            ]}
                        />
                    </div>
                } bottom={
                    <ScriptableUniformsEditor.Renderer editor={uniformsEditor} rerenderParent={rerender}/>
                }/>
            } right={
                <div id="canvas-container">
                    <ShaderCanvas.Renderer canvas={shaderCanvas} getUniforms={getUniforms}/>
                </div>
            }/>
        </div>
    );
}
