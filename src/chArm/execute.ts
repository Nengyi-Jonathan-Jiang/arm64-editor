import type { State } from "./state.ts";
import type { Instruction } from "./instructions.ts";

export class Executor {
    public state: State;
    public program: readonly Instruction[];
    public termination: Error | true | null = null;

    constructor (state: State, program: Instruction[]) {
        this.state = state;
        this.program = program;
    }

    reset (state: State, program: readonly Instruction[]) {
        this.state = state;
        this.program = program;
        this.termination = null;
    }

    previewNextState (): State | Error | null {
        if (this.termination) return this.state;

        const state = this.state.clone();

        try {
            this.updateState(this.state);
        }
        catch (e) {
            return wrapError(e);
        }

        return state;
    }

    get currInstruction (): Instruction | null {
        return this.program[this.state.currInstructionIndex] ?? null;
    }

    step (): Error | true | null {
        if (this.termination) return true;

        try {
            this.updateState(this.state);
        }
        catch (e) {
            return this.termination = wrapError(e);
        }

        return this.termination;
    }

    private updateState (state: State) {
        const instruction = this.program[state.currInstructionIndex];

        if (!instruction) {
            throw new Error("Program counter out of bounds");
        }

        instruction.apply(state);
    }
}

function wrapError (e: unknown): Error {
    return e instanceof Error ? e : new Error('Unknown error', { cause: e });
}