export interface Length {
    getValue(dimension: number): number;
}

export class AbsoluteLength implements Length {
    public readonly value: number;

    constructor(value: number) {
        this.value = value;
    }

    getValue(): number {
        return this.value;
    }
}

export class RelativeLength implements Length {
    public readonly percentage: number;

    constructor(percentage: number) {
        this.percentage = percentage;
    }

    getValue(dimension: number): number {
        return this.percentage * dimension;
    }
}

export class ShaderPassData {
    public mainCode: string;
    public bufferWidth: Length;
    public bufferHeight: Length;

    constructor(mainCode: string, bufferWidth: Length, bufferHeight: Length) {
        this.mainCode = mainCode;
        this.bufferWidth = bufferWidth;
        this.bufferHeight = bufferHeight;
    }
}