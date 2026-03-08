import React, {ReactNode} from "react";
import {useManualRerender} from "@/util/hooks";
import {Tabs} from "@/tabs/tabs";
import "./scriptableUniformsEditor.css"
import {
    EditableScriptableUniform,
    ScriptableUniform
} from "@/app/components/scriptableUniform";

export class ScriptableUniformsEditor {
    private readonly uniforms: ScriptableUniform[];

    constructor(uniforms: ScriptableUniform[] = []) {
        this.uniforms = uniforms;
    }

    addDirect(uniform: ScriptableUniform) {
        this.uniforms.push(uniform);
    }

    addNewEditable(): number | null {
        const uniform = new EditableScriptableUniform();
        uniform.name = `var${uniform.id}`;

        this.uniforms.push(uniform);
        return uniform.id;
    }

    delete(uniformID: number): boolean {
        const deletedUniformIndex = this.uniforms.findIndex(({id}) => id === uniformID);
        if (deletedUniformIndex === -1) return false;
        this.uniforms.splice(deletedUniformIndex, 1);
        return true;
    }

    get data() {
        return this.uniforms;
    }

    static Renderer({editor, rerenderParent}: {
        editor: ScriptableUniformsEditor,
        rerenderParent?: () => void
    }): ReactNode {
        const rerender = (rerender => () => {
            (rerenderParent ?? rerender)();
        })(useManualRerender());

        return <Tabs tabs={editor.uniforms.map(data => ({
            name: data.name,
            deletable: data instanceof EditableScriptableUniform,
            id: data.id,
            node: <ScriptableUniform.Renderer data={data} rerender={rerender}/>
        }))} addTab={() => {
            const addedTab = editor.addNewEditable();
            if (addedTab !== null) rerender();
            return addedTab;
        }} deleteTab={(tabID) => {
            if (editor.delete(tabID)) rerender();
        }}/>;
    }
}