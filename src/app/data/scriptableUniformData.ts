import {ShaderCanvasUniformType} from "@/app/webgl/ShaderCanvas";

export type ScriptableUniformType = (
    ShaderCanvasUniformType & (
    "float" | "int" | "vec2" | "ivec2" | "vec3" | "vec4" |
    "mat2" | "mat3" | "mat4"
    ));
export const scriptableUniformTypes: ScriptableUniformType[] = [
    "float", "int", "vec2", "ivec2", "vec3", "vec4",
    "mat2", "mat3", "mat4"
];

export type ScriptableUniformDataJSON = {
    name: string,
    type: ScriptableUniformType,
    initSrc: string,
    periodicSrc: string;
};

export class ScriptableUniformData {
    private static nextID: number = 0;
    public readonly id;

    public name: string;
    public type: ScriptableUniformType;
    public initSrc: string;
    public periodicSrc: string;

    constructor(name: string | undefined, type: ScriptableUniformType, initSrc: string, periodicSrc: string) {
        this.id = ScriptableUniformData.nextID++;
        this.name = name ?? `var${this.id}`;
        this.type = type;
        this.initSrc = initSrc;
        this.periodicSrc = periodicSrc;
    }

    static fromJSON({name, type, initSrc, periodicSrc}: ScriptableUniformDataJSON) {
        return new ScriptableUniformData(name, type, initSrc, periodicSrc);
    }
}