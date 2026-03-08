import { BigInt16, BigInt32, BigInt64, BigInt64Mask, randUnsignedBigint, toHexString, wrapUndef } from "../util/util";

namespace State {
    export type Registers = BigUint64Array & { length: 32 };
}

class MemoryError extends Error {
    constructor(message: string, ptr: bigint, startIndex: bigint, cause?: unknown) {
        super(
            `${message} (caused by pointer 0x${(
                ptr.toString(16).padStart(16, '0')
            )} = index [${startIndex}:${startIndex + 7n}])`,
            ...wrapUndef(cause, c => ({ cause: c }))
        )
    }
}

export class State {
    /** Registers should always be accessed in a big-endian way */
    private readonly registers: State.Registers;
    /** 
     * Represents the contents of memory, backward. Thus, endianness should be
     * flipped.
     */
    private mem: Uint8Array;
    /** A random offset to memory addresses */
    private readonly memOffset: bigint;
    /** NZCV flags */
    private flags: number;
    /** Program counter */
    private programCounter: number = 0;
    /** Total bytes of memory used */
    private memSize: number = 0;

    constructor(dataBytes?: Uint8Array) {
        // Figure out how many extra bytes of memory we need to reserve at the 
        // beginning for data
        dataBytes ??= new Uint8Array;
        const numDataBytes = dataBytes.length;
        const numDataBytesWithPadding = numDataBytes
            ? numDataBytes + (Number(randUnsignedBigint(4)) << 4)
            : 0;

        // Generate random register values
        this.registers = new BigUint64Array(32).map(
            () => randUnsignedBigint(64)
        ) as State.Registers;

        // Start with a bunch of memory
        this.mem = new Uint8Array(65536 + numDataBytesWithPadding);
        this.memSize = dataBytes.length;
        // Remember that mem is reversed, so we need to put dataBytes in reverse 
        // order
        for (let i = 0; i < numDataBytes; i++) {
            this.mem[numDataBytes - i - 1] = dataBytes[i];
        }

        // Generates a random value from 01000...0000 to 010111...110000
        // aligned to 16 bytes for the memory offset
        this.memOffset = (randUnsignedBigint(59) + (1n << 58n)) << 4n;
        // Set stack pointer
        this.register("SP").setBigUint64(0,
            this.memOffset - BigInt(numDataBytesWithPadding)
        );

        // Generate random nzcv
        this.flags = Number(randUnsignedBigint(4));
    }

    /** 
     * Returns an 8-byte Big Endian DataView representing the contents of the 
     * regsiter
     */
    register(register: Register): DataView {
        if (register === "ZR") return new DataView(new ArrayBuffer(8));
        return new DataView(
            this.registers.buffer,
            (register == "SP" ? 31 : register) << 3,
            8
        );
    }

    /**
     * Returns an 8-byte Big Endian DataView representing the contents of 
     * memory at register + offset. 
     */
    memory(register: Register, offset: number): DataView {
        const effectiveAddress =
            this.register(register).getBigUint64(0) + BigInt(offset);

        const startIndex = -8n - (effectiveAddress - this.memOffset);
        if (startIndex < 0) {
            throw new MemoryError(
                "Out of bounds memory access",
                effectiveAddress, startIndex
            );
        }

        try {
            this.ensureHasMemory(startIndex + 8n);
        }
        catch (e) {
            if (e instanceof Error) {
                throw new MemoryError(
                    e.message,
                    effectiveAddress, startIndex,
                    e.cause
                )
            }
            throw e;
        }

        this.memSize = Math.max(this.memSize, Number(startIndex) + 8);

        return new DataView(this.mem.buffer, Number(startIndex), 8);
    }

    get n(): boolean {
        return !!(this.flags & 0b1000);
    }
    set n(n: boolean) {
        this.flags = n ? this.flags | 0b1000 : this.flags & 0b0111;
    }
    get z(): boolean {
        return !!(this.flags & 0b0100);
    }
    set z(z: boolean) {
        this.flags = z ? this.flags | 0b0100 : this.flags & 0b1011;
    }
    get c(): boolean {
        return !!(this.flags & 0b0010);
    }
    set c(c: boolean) {
        this.flags = c ? this.flags | 0b0010 : this.flags & 0b1101;
    }
    get v(): boolean {
        return !!(this.flags & 0b0001);
    }
    set v(v: boolean) {
        this.flags = v ? this.flags | 0b0001 : this.flags & 0b1110;
    }
    resetNZCV() {
        this.flags = 0;
    }

    get PC() {
        return this.programCounter;
    }

    incPC() {
        this.programCounter++;
    }

    branchPCrel(offset: number): void {
        this.programCounter += offset;
    }

    ret() {
        this.programCounter = Number(this.registers[30]) + 1;
    }

    printRegisters(binary: boolean = false, ...registers: Register[]) {
        if (registers.length === 0) {
            registers = [
                "SP",
                ...new Array(31).fill(0).map((_, i) => i as Register)
            ];
        }

        console.log(registers
            .map(i => [i, this.register(i).getBigUint64(0)] as const)
            .map(([n, i]) =>
                `${(
                    n.toString().padStart(2)
                )}: 0x${(
                    i.toString(16).padStart(16, '0')
                )} = unsigned ${(
                    i.toString().padStart(20)
                )} = signed ${(
                    BigInt.asIntN(64, i).toString().padStart(20)
                )}` + (
                    binary ? ` = 0b ${i.toString(2).padStart(64, '0')}` : ''
                )
            ).join('\n')
        )
    }

    printMemory(): void;
    printMemory(register: Register, offset: number): void;
    printMemory(register?: Register, offset?: number) {
        const view = register === undefined
            ? new DataView(this.mem.buffer)
            : this.memory(register, offset!);
        const bytes = [...new Uint8Array(
            view.buffer,
            view.byteOffset,
            this.memSize
        )];
        bytes.push(...new Array(((-bytes.length) & 0xf)).fill(0));

        console.log(bytes.length == 0
            ? 'Memory: \n[empty]'
            : `Memory (starting at 0x${toHexString(this.memOffset, 8)} - ${(
                bytes.length
            )}):\n...${bytes.toReversed().map((b, i) => {
                return (i & 0xf ? ' ' : '\n') + toHexString(b, 1);
            }).join('')}\n...`
        )
    }

    private ensureHasMemory(requiredSize: bigint) {
        let newMemorySize = BigInt(this.mem.length);
        if (requiredSize <= newMemorySize) return;

        let doublings = 0;
        while (requiredSize > newMemorySize) {
            newMemorySize <<= 1n;
            doublings++;
            if (newMemorySize > 16777216n) {
                throw new Error("Accessing too much memory");
            }
            if (doublings > 2) {
                // Something's probably wrong, we are growing memory way too fast
                throw new Error("Memory size growing way too quickly");
            }
        }
        const newMemory = new Uint8Array(Number(newMemorySize));
        newMemory.set(this.mem);
        this.mem = newMemory;
    }
}

(window as any)['rand'] = randUnsignedBigint;
(window as any)['State'] = State;

export type Instruction = STUR | LDUR | MOV | ADRP | ADDS | SUBS;

export type Register = RegisterGP | "SP" | "ZR";
export type RegisterSP = RegisterGP | "SP";
export type RegisterZR = RegisterGP | "ZR";
export type RegisterGP = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
    | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30;


interface InstructionBase {
    readonly opcode: string;
    /** 
     * Run the given instruction. If this returns true, do not increment the 
     * instruction pointer 
     */
    applyTo?(state: State): void | boolean;
}

export class LDUR implements InstructionBase {
    public readonly opcode = "LDUR";
    public readonly operands: { dest: RegisterGP, src_base: RegisterSP, offset: number };

    constructor(dest: RegisterGP, src_base: RegisterSP, offset: number = 0) {
        this.operands = { dest, src_base, offset };
    }

    applyTo(state: State): void {
        const { src_base, offset, dest } = this.operands;
        const value = state.memory(src_base, offset).getBigUint64(0, true);
        state.register(dest).setBigUint64(0, value);
    }
}

export class STUR implements InstructionBase {
    public readonly opcode = "STUR";
    public readonly operands: { src: RegisterGP, dest_base: RegisterSP, offset: number };

    constructor(src: RegisterGP, dest_base: RegisterSP, offset: number = 0) {
        this.operands = { src, dest_base, offset };
    }

    applyTo(state: State): void {
        const { src, dest_base, offset } = this.operands;
        const value = state.register(src).getBigUint64(0);
        state.memory(dest_base, offset).setBigUint64(0, value, true);
    }
}

export class MOV implements InstructionBase {
    public readonly opcode: "MOVK" | "MOVZ";
    public readonly operands: { dest: RegisterGP, value: number, shift: number };
    public readonly zero: boolean;

    constructor(dest: RegisterGP, value: number, shift: number, zero: boolean = true) {
        this.opcode = `MOV${zero ? "Z" : "K"}`;
        this.zero = zero;
        this.operands = { dest, value, shift };
    }

    applyTo(state: State): void {
        const { dest, value, shift } = this.operands;
        const register = state.register(dest);
        if (this.zero) register.setBigUint64(0, 0n);
        register.setUint16(shift >> 3, value);
    }
}

export class ADRP implements InstructionBase {
    public readonly opcode = "ADRP";
    public readonly operands: { dest: RegisterGP, value: number };

    constructor(dest: RegisterGP, value: number) {
        this.operands = { dest, value };
    }

    applyTo(state: State): void {
        // const { dest, value } = this.operands;

    }
}

export class ADDS implements InstructionBase {
    public readonly opcode = "ADDS";
    public readonly operands: { dest: RegisterGP, a: RegisterSP, b: RegisterZR };

    constructor(dest: RegisterGP, a: RegisterSP, b: RegisterZR) {
        this.operands = { dest, a, b };
    }
}

export class SUBS implements InstructionBase {
    public readonly opcode = "SUBS";
}

/*
instructions:

LDUR, STUR.
• operands processing — immediate: MOVK, MOVZ, ADRP.
• Computation: ADD, ADDS, CMN, SUB, SUBS, CMP, MVN, ORR, EOR, ANDS, TST, LSL, LSR,
UBFM, ASR.
• Control transfer: B, B.cond, BL, RET.
• Miscellaneous: NOP, HLT
*/

export function parse_chArm_src(source_lines: string[]): Instruction[] {
    return [];
}