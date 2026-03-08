import {ReactNode} from "react";
import {CodeHighlighter} from "@/codeEditor/codeHighlighter";

import './highlighted.css'
import {HighlighterWithErrors} from "@/codeEditor/highlighterWithErrors";
import {providedNames} from "@/app/shaderProvidedFunctions";

function sanitizeForRegex(str: string): string {
    return str.replaceAll(/[$-/?[-^{|}]/g, '\\$&');
}

function toCombinedRegex(...regexes: string[]): RegExp {
    const combinedRegexString = `^(${regexes.map(i => `(${i})`).join('|')})`;
    return new RegExp(combinedRegexString);
}

const keywordRegex = toCombinedRegex(
    "const",

    "void",
    "float", "double", "int", "bool",

    "uniform", "varying",
    "break", "continue",
    "for", "switch", "case", "default", "if", "else",
    "in", "out", "inout",
    "discard",
    "return",
    "lowp", "mediump", "highp", "precision",
    "struct",
);
const builtinTypeRegex = toCombinedRegex(
    "mat2", "mat3", "mat4",
    "dmat2", "dmat3", "dmat4",
    "mat2x2", "mat2x3", "mat2x4",
    "dmat2x2", "dmat2x3", "dmat2x4",
    "mat3x2", "mat3x3", "mat3x4",
    "dmat3x2", "dmat3x3", "dmat3x4",
    "mat4x2", "mat4x3", "mat4x4",
    "dmat4x2", "dmat4x3", "dmat4x4",
    "vec2", "vec3", "vec4",
    "ivec2", "ivec3", "ivec4",
    "bvec2", "bvec3", "bvec4",
    "dvec2", "dvec3", "dvec4",
    "uint", "uvec2", "uvec3", "uvec4",

    "sampler1D", "sampler2D", "sampler3D",
    "isampler1D", "isampler2D", "isampler3D",
    "usampler1D", "usampler2D", "usampler3D",
    "sampler1DArray", "sampler2DArray",
    "isampler1DArray", "isampler2DArray",
    "usampler1DArray", "usampler2DArray",

    "sampler2DRect", "isampler2DRect",
    "usampler2DRect", "samplerBuffer",
    "isamplerBuffer", "usamplerBuffer",

    "sampler2DMS", "isampler2DMS",
    "usampler2DMS", "sampler2DMSArray",
    "isampler2DMSArray", "usampler2DMSArray",
    "image1D", "iimage1D", "uimage1D",
    "image2D", "iimage2D", "uimage2D",
    "image3D", "iimage3D", "uimage3D",
    "image2DRect", "iimage2DRect", "uimage2DRect",
    "imageBuffer", "iimageBuffer", "uimageBuffer",
    "image1DArray", "iimage1DArray", "uimage1DArray",
    "image2DArray", "iimage2DArray", "uimage2DArray",
    "image2DMS", "iimage2DMS", "uimage2DMS",
    "image2DMSArray", "iimage2DMSArray", "uimage2DMSArray",
);
const builtinFunctionRegex = toCombinedRegex(
    "radians", "degrees",
    "sin", "cos", "tan", "asin", "acos", "atan",
    "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
    "pow", "exp", "log", "exp2", "log2", "sqrt", "inversesqrt",
    "floor", "trunc", "round", "roundEven", "ceil", "fract", "mod", "modf",
    "abs", "sign", "min", "max", "clamp", "mix", "step", "smoothstep",
    "isnan", "isinf", "fma",
    "length", "distance", "dot", "cross", "normalize",
    "faceforward", "reflect", "refract",
    "matrixCompMult", "outerProduct", "transpose", "determinant", "inverse",
    "texture", "texelFetch", "textureOffset", "texelFetchOffset"
);
const builtinVarRegex = toCombinedRegex("");

const providedFunctionRegex = toCombinedRegex(
    ...providedNames
);

const reservedKeywordRegex = toCombinedRegex(
    "attribute", "buffer", "shared", "coherent", "volatile", "restrict", "readonly", "writeonly",
    "atomic_uint", "layout", "centroid", "flat", "smooth", "noperspective", "patch", "sample", "do",
    "while", "subroutine", "invariant", "precise", "common", "partition", "active", "asm", "class",
    "union", "enum", "typedef", "template", "this", "resource", "goto", "inline", "noinline", "public",
    "static", "extern", "external", "interface", "long", "short", "half", "fixed", "unsigned", "superp",
    "input", "output", "hvec2", "hvec3", "hvec4", "fvec2", "fvec3", "fvec4", "sampler3DRect", "filter",
    "sizeof", "cast", "namespace", "using"
);
const literalsRegex = toCombinedRegex("true", "false", "\\d+\\.\\d*|\\.\\d+|\\d+");
const operatorsRegex = toCombinedRegex(...`
    ++ -- + - ! * / + - < <= > >= == != && ^^ || ? : = += -= *= /=
    % %=
    << <<= >> >>= & &= ^ ^= | |=
`.trim().split(/\s+/g).map(sanitizeForRegex));
const punctuationRegex = toCombinedRegex(...[..."{.}(,)[;]"].map(sanitizeForRegex));
const commentRegex = /^(\/\/[^\n]*|\/\*([^*]|\*+[^*/])*\**\*\/)/;
const identifierRegex = /^[A-Za-z_]\w*/;

const preprocessorRegex = toCombinedRegex(
    '#define',
    '#ifdef',
    '#endif',
    '#else',
    '#version\\s+[13]00\\s+es'
);

export function GLSLHighlighter({value, errors}: {
    value: string,
    errors: Map<number, string[]>
}): ReactNode {
    return <div className='glsl'>
        <HighlighterWithErrors errors={errors}>
            <CodeHighlighter rules={{
                'keyword': keywordRegex,
                'builtin-type': builtinTypeRegex,
                'builtin-func': builtinFunctionRegex,
                'builtin-var': builtinVarRegex,
                'reserved': reservedKeywordRegex,
                'provided': providedFunctionRegex,
                'literal': literalsRegex,
                'operator': operatorsRegex,
                'punctuation': punctuationRegex,
                'comment': commentRegex,
                'identifier': identifierRegex,
                'preprocessor': preprocessorRegex
            }}>{value}</CodeHighlighter>
        </HighlighterWithErrors>
    </div>
}