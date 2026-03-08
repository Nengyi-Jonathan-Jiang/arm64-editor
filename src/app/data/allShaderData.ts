import {ScriptableUniformData, ScriptableUniformDataJSON} from "@/app/data/scriptableUniformData";

export type AllShaderDataJSON = {
    uniformData: ScriptableUniformDataJSON[];
};

export class AllShaderData {
    public uniformsData: ScriptableUniformData[];

    constructor(uniformsData: ScriptableUniformData[]) {
        this.uniformsData = uniformsData;
    }

    static fromJSON({uniformData}: AllShaderDataJSON) {
        const uniforms = uniformData.map(i => ScriptableUniformData.fromJSON(i))
        return new AllShaderData(uniforms);
    }
}