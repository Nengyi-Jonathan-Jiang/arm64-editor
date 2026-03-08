"use client";

import React, {ReactNode, useEffect, useRef} from "react";
import {useAnimation, useListenerOnHTMLElement, useListenerOnWindow} from "@/util/hooks";

export interface ShaderCanvasUniformTypeMap {
    float: number,
    int: number,
    vec2: readonly [number, number],
    ivec2: readonly [number, number],
    vec3: readonly [number, number, number],
    vec4: readonly [number, number, number, number],
    mat2: readonly number[],
    mat3: readonly number[],
    mat4: readonly number[],
    sampler2D: number,
    samplerCube: number,
}

export type ShaderCanvasUniformType = keyof ShaderCanvasUniformTypeMap;

export type ShaderCanvasUniformData = {
    name: string;
    type: keyof ShaderCanvasUniformTypeMap;
    value: number | readonly number[]
};

export class ShaderCanvas {
    private program: WebGLProgram | null = null;
    private _canvasElement: HTMLCanvasElement | null = null;
    private webglContext: WebGL2RenderingContext | null = null;
    public readonly errors: { line: number, message: string }[] = [];

    public get canvasElement(): HTMLCanvasElement {
        this.initCanvas();
        return this._canvasElement as HTMLCanvasElement;
    }

    initCanvas() {
        if (this._canvasElement) return;
        this._canvasElement = document.createElement('canvas');
        const canvas = this.canvasElement;
        const gl = canvas.getContext("webgl2", {antialias: false});
        if (!gl) throw Error("ERROR: WEBGL NOT SUPPORTED");
        this.webglContext = gl;

        gl.getExtension('EXT_color_buffer_float');
        gl.getExtension('OES_texture_float_linear');
        gl.clearColor(0, 0, 0, 0);

        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    }

    get width() {
        if (!this.canvasElement) return 1;
        return this.canvasElement.width;
    }

    get height() {
        if (!this.canvasElement) return 1;
        return this.canvasElement.height;
    }

    setCanvasSize(width: number, height: number) {
        if (!this.canvasElement || !this.webglContext) return;
        this.canvasElement.width = width;
        this.canvasElement.height = height;
        this.webglContext.viewport(0, 0, width, height);
    }

    setProgram(shaderSource: string, fragmentSource: string) {
        if (!this.webglContext) return;

        this.errors.splice(0, Number.POSITIVE_INFINITY);
        this.program = this.createProgramFromSources(
            this.webglContext,
            shaderSource,
            fragmentSource
        ) ?? this.program;
        this.webglContext.useProgram(this.program);
    }

    setUniform<K extends ShaderCanvasUniformType>(
        name: string,
        type: K,
        data: ShaderCanvasUniformTypeMap[K]
    ) {
        if (this.webglContext === null) return;
        if (this.program === null) return;

        const location = this.webglContext.getUniformLocation(this.program, name);
        if (location === null) return;

        try {

            switch (type) {
                case "float":
                    // @ts-ignore
                    return this.webglContext.uniform1f(location, data);
                case "int":
                    // @ts-ignore
                    return this.webglContext.uniform1i(location, data);
                case "ivec2":
                    // @ts-ignore
                    return this.webglContext.uniform2i(location, ...data);
                case "vec2":
                    // @ts-ignore
                    return this.webglContext.uniform2f(location, ...data);
                case "vec3":
                    // @ts-ignore
                    return this.webglContext.uniform3f(location, ...data);
                case "vec4":
                    // @ts-ignore
                    return this.webglContext.uniform4f(location, ...data);
                case "mat2":
                    // @ts-ignore
                    return this.webglContext.uniformMatrix2fv(location, false, data);
                case "mat3":
                    // @ts-ignore
                    return this.webglContext.uniformMatrix3fv(location, false, data);
                case "mat4":
                    // @ts-ignore
                    return this.webglContext.uniformMatrix4fv(location, false, data);
                default:
                    return;
            }
        } finally {
        }
    }

    setUniforms(uniforms: {
        name: string,
        type: keyof ShaderCanvasUniformTypeMap,
        value: number | readonly number[]
    }[]) {
        for (const {name, type, value} of uniforms) {
            this.setUniform(name, type, value as ShaderCanvasUniformTypeMap[typeof type]);
        }
    }

    draw() {
        if (this.webglContext === null) return;
        if (this.program === null) return;
        this.webglContext.clear(
            this.webglContext.COLOR_BUFFER_BIT | this.webglContext.DEPTH_BUFFER_BIT
        );
        this.webglContext.drawArrays(this.webglContext.TRIANGLES, 0, 6);
    }

    private createShader(gl: WebGLRenderingContext, shaderSource: string, shaderType: number): WebGLShader | null {
        const shader = gl.createShader(shaderType) as WebGLShader;
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const errorMessage = gl.getShaderInfoLog(shader) ?? '';

            this.errors.push(...[...errorMessage.matchAll(/ERROR:\s+0:\d+:\s+[^\n]+/g)]
                .map(i => /ERROR:\s+0:(\d+):\s+([^\n]+)/g.exec(i[0]) as RegExpExecArray)
                .map(([, line, message]) => ({
                    line: +line - 1,
                    message
                })));

            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private createProgram(gl: WebGLRenderingContext, ...shaders: WebGLShader[]): WebGLProgram | null {
        const program = gl.createProgram() as WebGLProgram;
        for (const shader of shaders) gl.attachShader(program, shader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const errors = (gl.getProgramInfoLog(program) ?? '').trim().split(/\s*\n\s*/);
            this.errors.push(...errors.map(i => {
                return {
                    line: 0,
                    message: i
                }
            }));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    private createProgramFromSources(gl: WebGLRenderingContext, vertSource: string, fragSource: string): WebGLProgram | null {
        const vertShader = this.createShader(gl, vertSource, gl.VERTEX_SHADER);
        const fragShader = this.createShader(gl, fragSource, gl.FRAGMENT_SHADER);

        if (vertShader === null || fragShader === null) {
            return null;
        }

        return this.createProgram(gl,
            vertShader,
            fragShader
        );
    }

    public static Renderer({canvas, getUniforms}: {
        canvas: ShaderCanvas,
        getUniforms: (data: {
            canvas: ShaderCanvas,
            currentTime: DOMHighResTimeStamp,
            mousePosition: readonly [number, number],
            mouseButtonsDown: number,
        }) => ShaderCanvasUniformData[]
    }): ReactNode {
        const placeholderRef = useRef<HTMLDivElement>(null);

        const mousePosition = useRef<[number, number]>([0, 0]);
        const mouseButtonsDown = useRef<number>(0);

        useEffect(() => {
            console.log('Initializing canvas');
            canvas.initCanvas();
        }, []);

        useEffect(() => {
            const placeholderElement = placeholderRef.current;
            if (placeholderElement) {
                placeholderElement.replaceWith(canvas.canvasElement);
            }
        });

        // Mouse position tracking
        const updateMouse = (e: {
            buttons: number,
            clientX: number,
            clientY: number,
            preventDefault?: () => void
        }) => {
            const {buttons, clientX, clientY} = e;

            const {height, left, right, top, bottom, width} = canvas.canvasElement.getBoundingClientRect();

            // Update the position if the position is in bounds
            if (left <= clientX && clientX <= right && top <= clientY && clientY <= bottom) {
                const x = 2 * (clientX - left - width / 2) / canvas.canvasElement.height;
                const y = -2 * (clientY - top - height / 2) / canvas.canvasElement.height;
                mousePosition.current = [x, y];
                mouseButtonsDown.current = buttons;
            } else {
                mousePosition.current = [0, 0];
                // Only keep the buttons that are already down, and update any
                // buttons that have been released
                mouseButtonsDown.current &= buttons;
            }

            if (e.preventDefault) e.preventDefault();
        };

        const fakeCanvasElementRef = {
            get current() {
                return canvas.canvasElement;
            }
        };
        useListenerOnHTMLElement(fakeCanvasElementRef, "mouseup", updateMouse);
        useListenerOnHTMLElement(fakeCanvasElementRef, "mousedown", updateMouse);
        useListenerOnWindow("mousemove", updateMouse);
        useListenerOnHTMLElement(fakeCanvasElementRef, "mouseenter", updateMouse);
        useListenerOnHTMLElement(fakeCanvasElementRef, "mouseleave", updateMouse);
        useListenerOnHTMLElement(fakeCanvasElementRef, "contextmenu", e => e.preventDefault());
        useListenerOnWindow("blur", updateMouse.bind(null, {
            buttons: 0, clientX: 0, clientY: 0
        }));

        useAnimation((currentTime) => {
            canvas.setCanvasSize(canvas.canvasElement.clientWidth, canvas.canvasElement.clientHeight);
            canvas.setUniforms(getUniforms({
                canvas,
                currentTime,
                mousePosition: mousePosition.current,
                mouseButtonsDown: mouseButtonsDown.current
            }));
            canvas.draw();
        })

        return <div ref={placeholderRef}></div>
    }
}
