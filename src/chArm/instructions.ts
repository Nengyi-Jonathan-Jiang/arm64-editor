import { isUint64N, isUint64C, getUint64Complement, isUint64Z } from "../util/util";
import type { State, RegisterSP, RegisterZR, RegisterGP } from "./state";


export type Instruction = Readonly<
    STUR | LDUR | MOV | ADRP | ADDS | SUBS | CMN
>;

export type InstructionType = Instruction["opcode"];

interface InstructionBase {
    opcode: string;
    /**
     * Run the given instruction. If this returns true, do not increment the
     * instruction pointer
     */
    applyTo?(state: State): void | boolean;
}

type _Register = RegisterSP | RegisterZR;

abstract class BinOpRR<
    dst extends _Register = _Register,
    a extends _Register = _Register,
    b extends _Register = _Register,
> implements InstructionBase {
    abstract readonly opcode: string;
    readonly operands: { dst: dst; a: a; b: b; };
    constructor(dst: dst, a: a, b: b) {
        this.operands = { dst, a, b };
    }
    applyTo(state: State): void {
        const { dst, a, b } = this.operands;

        state.setRegister(dst, this.doOperation(
            state.getRegister(a), state.getRegister(b), state
        ));
    }

    abstract doOperation(a: bigint, b: bigint, state: State): bigint;
}

abstract class BinOpRI<
    dst extends _Register = RegisterGP,
    a extends _Register = RegisterGP,
> implements InstructionBase {
    abstract readonly opcode: string;
    readonly operands: { dst: dst; a: a; b: bigint; };
    constructor(dst: dst, a: a, b: bigint) {
        this.operands = { dst, a, b };
    }
    applyTo(state: State): void {
        const { dst, a, b } = this.operands;

        state.setRegister(dst, this.doOperation(
            state.getRegister(a), b, state
        ));
    }

    abstract doOperation(a: bigint, b: bigint, state: State): bigint;
}

abstract class BinOpRX<
    dst extends _Register = _Register,
    a extends _Register = _Register,
    b extends _Register = _Register,
> implements InstructionBase {
    abstract readonly opcode: string;
    readonly operands: { dst: dst; a: a; b: b | bigint; };
    readonly isI: boolean;

    constructor(dst: dst, a: a, b: b | bigint) {
        this.operands = { dst, a, b };
        this.isI = (typeof b === "bigint") as never;
    }
    applyTo(state: State): void {
        const { dst, a, b } = this.operands;

        state.setRegister(dst, this.doOperation(
            state.getRegister(a),
            this.isI ? b as bigint : state.getRegister(b as b),
            state
        ));
    }

    abstract doOperation(a: bigint, b: bigint, state: State): bigint;
}

export class LDUR implements InstructionBase {
    readonly opcode = "LDUR";
    readonly operands: { dst: RegisterGP; src_b: RegisterSP; offset: bigint; };

    constructor(dst: RegisterGP, src_b: RegisterSP, offset: bigint = 0n) {
        this.operands = { dst, src_b, offset };
    }

    applyTo(state: State): void {
        const { src_b, offset, dst } = this.operands;
        const value = state.getMemory(src_b, offset);
        state.setRegister(dst, value);
    }
}

export class STUR implements InstructionBase {
    readonly opcode = "STUR";
    readonly operands: { src: RegisterGP; dst_b: RegisterSP; offset: bigint; };

    constructor(src: RegisterGP, dst_b: RegisterSP, offset: bigint = 0n) {
        this.operands = { src, dst_b, offset };
    }

    applyTo(state: State): void {
        const { src, dst_b, offset } = this.operands;
        const value = state.getRegister(src);
        state.setMemory(dst_b, offset, value);
    }
}

// This includes MOVK and MOVN
export class MOV implements InstructionBase {
    readonly opcode: "MOVK" | "MOVZ";
    readonly operands: { dst: RegisterGP; value: bigint; shift: bigint; };
    readonly zero: boolean;

    constructor(dst: RegisterGP, value: bigint, shift: bigint, zero: boolean = true) {
        this.opcode = `MOV${zero ? "Z" : "K"}`;
        this.zero = zero;
        this.operands = { dst, value, shift };
    }

    applyTo(state: State): void {
        const { dst, value, shift } = this.operands;
        const register = state.rawRegister(dst);
        if (this.zero) register.setBigUint64(0, 0n);
        // Registers are big-endian
        register.setUint16(6 - Number(shift >> 3n), Number(value));
    }
}

export class ADRP implements InstructionBase {
    readonly opcode = "ADRP";
    readonly operands: { dst: RegisterGP; offset: bigint; };

    constructor(dst: RegisterGP, value: bigint) {
        this.operands = { dst, offset: value };
    }

    applyTo(state: State): void {
        const { dst, offset: value } = this.operands;
        state.setRegister(dst, state.PC + value);
    }
}

export class ADD extends BinOpRI<RegisterSP, RegisterSP> {
    readonly opcode = "ADD";

    doOperation(a: bigint, b: bigint, _: State): bigint {
        return a + b;
    }
}

export class ADDS extends BinOpRR<RegisterZR, RegisterZR, RegisterZR> {
    readonly opcode = "ADDS";

    doOperation(a: bigint, b: bigint, state: State): bigint {
        const res = a + b;

        state.n = isUint64N(res);
        state.z = isUint64Z(res);
        state.c = isUint64C(res);
        state.v = isUint64N(a) != state.n && isUint64N(b) != state.n;

        return res;
    }
}

export class CMN extends BinOpRI<"ZR", RegisterGP> {
    readonly opcode = "CMN";

    constructor(a: RegisterGP, b: bigint) {
        super("ZR", a, b);
    }

    doOperation = ADDS.prototype.doOperation;
}

export class SUB extends BinOpRI<RegisterSP, RegisterSP> {
    readonly opcode = "SUB";

    doOperation(a: bigint, b: bigint, _: State): bigint {
        return a - b;
    }
}

export class SUBS extends BinOpRR<RegisterZR, RegisterZR, RegisterZR> {
    readonly opcode = "SUBS";

    doOperation(a: bigint, b: bigint, state: State): bigint {
        const res = a - b;

        state.n = isUint64N(res);
        state.z = isUint64Z(res);
        state.c = isUint64C(res);
        state.v = isUint64N(a) != state.n && isUint64N(b) != state.n;

        return res;
    }
}

export class CMP extends BinOpRI<"ZR", RegisterGP> {
    readonly opcode = "CMP";

    constructor(a: RegisterGP, b: bigint) {
        super("ZR", a, b);
    }

    doOperation = SUBS.prototype.doOperation;
}

export class MVN implements InstructionBase {
    readonly opcode = "MVN";
    readonly operands: { dst: RegisterGP, a: RegisterGP };

    constructor(dst: RegisterGP, a: RegisterGP) {
        this.operands = { dst, a };
    }

    applyTo(state: State): void {
        const { dst, a } = this.operands;
        state.setRegister(dst, ~state.getRegister(a));
    }
}

export class ORR extends BinOpRR {
    readonly opcode = "ORR";

    doOperation(a: bigint, b: bigint, _: State): bigint {
        return a | b;
    }
}

export class EOR extends BinOpRR {
    readonly opcode = "EOR";

    doOperation(a: bigint, b: bigint, _: State): bigint {
        return a ^ b;
    }
}

export class ANDS extends BinOpRR {
    readonly opcode = "ANDS";

    doOperation(a: bigint, b: bigint, state: State): bigint {
        const res = a & b;

        state.n = isUint64N(res);
        state.z = isUint64Z(res);
        // Apparently most implementations clear this flag because ANDS has 
        // optional operands that shift the second argument, in which case a 
        // carry becomes possible. Even though that isn't possible here, we 
        // probably still need to update the flag.
        state.c = false;
        // Don't update the v flag

        return res;
    }
}

export class TST extends BinOpRI<"ZR", RegisterGP> {
    readonly opcode = "TST";

    constructor(a: RegisterGP, b: bigint) {
        super("ZR", a, b);
    }

    doOperation = ANDS.prototype.doOperation;
}

export class LSL extends BinOpRX {
    readonly opcode = "LSL";

    doOperation(a: bigint, b: bigint, _: State): bigint {
        return a << (b & 63n);
    }
}

export class LSR extends BinOpRX {
    readonly opcode = "LSR";

    doOperation(a: bigint, b: bigint, _: State): bigint {
        return a >> (b & 63n);
    }
}

export class ASR extends BinOpRI<RegisterGP, RegisterGP> {
    readonly opcode = "ASR";

    doOperation(a: bigint, b: bigint, _: State): bigint {
        return BigInt.asIntN(64, a) >> b;
    }
}

export class UBFM implements InstructionBase {
    readonly opcode = "ASR";
    readonly operands: { dst: RegisterGP, a: RegisterGP, r: bigint, s: bigint };

    constructor(dst: RegisterGP, a: RegisterGP, r: bigint, s: bigint) {
        this.operands = {dst, a, r, s};
    }

    applyTo(state: State): void {
        const {dst, a, r, s} = this.operands;
        state.setRegister(dst, UBFM.doOperation(state.getRegister(a), r, s));
    }

    static doOperation(src: bigint, r: bigint, s: bigint): bigint {
        const mask = (1n << s) - 1n;
        return r >= s ? (src >> r) & mask : (src & mask) << (64n - r);
    }
}




/*
instructions:

LDUR, STUR
MOVK, MOVZ, ADRP
ADD, ADDS, CMN, SUB, SUBS, CMP, MVN, ORR, EOR, ANDS, TST, LSL, LSR, ASR, UBFM

B, B.cond, BL, RET
NOP, HLT
*/