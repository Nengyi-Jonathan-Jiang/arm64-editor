import type { State } from "./state.ts";
import type { Instruction } from "./instructions.ts";

export class Executor {
    public state: State;
    public program: readonly Instruction[];

    constructor (state: State, program: Instruction[]) {
        this.state = state;
        this.program = program;
    }

    previewNextState (): State | null {
        const state = this.state.clone();
        const instruction = this.program[state.currInstructionIndex];
        if (!instruction) return null;

        instruction.apply(state);

        return state;
    }

    get currInstruction() : Instruction | null {
        return this.program[this.state.currInstructionIndex] ?? null;
    }

    step () {
        const instruction = this.program[this.state.currInstructionIndex];
        if (!instruction) {
            throw new Error("Program counter out of bounds");
        }
        instruction.apply(this.state);
    }
}