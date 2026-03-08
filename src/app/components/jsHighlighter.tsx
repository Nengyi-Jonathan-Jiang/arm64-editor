import {ReactNode} from "react";
import {CodeHighlighter} from "@/codeEditor/codeHighlighter";

import './highlighted.css'
import {HighlighterWithErrors} from "@/codeEditor/highlighterWithErrors";

function sanitizeForRegex(str: string): string {
    return str.replaceAll(/[$-/?[-^{|}]/g, '\\$&');
}

function toCombinedRegex(...regexes: string[]): RegExp {
    const combinedRegexString = `^(${regexes.map(i => `(${i})`).join('|')})`;
    return new RegExp(combinedRegexString);
}

const keywordRegex = toCombinedRegex(
    "break", "case", "catch",
    "class", "const",
    "continue", "constructor",
    "default", "do",
    "else", "enum",
    "extends",
    "finally", "for", "function",
    "if", "let",
    "null",
    "of",
    "return", "static",
    "super", "switch", "this",
    "throw", "try", "typeof", "var", "undefined",
    "while", "yield",
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
);
const builtinFunctionRegex = toCombinedRegex(
    "abs", "acos", "acosh", "asin", "asinh", "atan",
    "atan2", "atanh", "cbrt", "ceil", "clz32", "cos",
    "cosh", "exp", "expm1", "floor", "fround", "hypot",
    "imul", "log", "log1p", "log2", "log10", "max", "min",
    "pow", "random", "round", "sign", "sin", "sinh", "sqrt",
    "tan", "tanh", "trunc",

    "isNaN",

    "registerUniform",
);
const builtinVarRegex = toCombinedRegex(
    "E", "LN2", "LN10", "LOG2E", "LOG10E", "PI", "SQRT1_2", "SQRT2"
);

const reservedKeywordRegex = toCombinedRegex("");

const literalsRegex = toCombinedRegex("true", "false", "(\\d+\\.\\d*|\\.\\d+|\\d+)(e-?\\d+)?", "NaN");
const stringLiteralRegex = toCombinedRegex('"([^"\\\\]|\\\\.)*"', "'([^'\\\\]|\\\\.)*'")

const operatorsRegex = toCombinedRegex(...`
    ++ -- + - ! * / + -  && || ? : = += -= *= /=
    % %=
    << <<= >> >>= & &= ^ ^= | |=
    
    += -= *= /= %= **= <<= >>= &= ^= |= &&= ||= ??=
    = + - * / % ** << >> & ^ | && || ??
    
    ++ -- ~ ! ? :
    
    < <= > >= == != === !==
    
    delete new typeof void in instanceof
`.trim().split(/\s+/g).map(sanitizeForRegex));
const punctuationRegex = toCombinedRegex(...[..."{.}(,)[;]", "?."].map(sanitizeForRegex));
const commentRegex = /^(\/\/[^\n]*|\/\*([^*]|\*+[^*/])*\**\*\/)/;
const identifierRegex = /^[A-Za-z_]\w*/;

const preprocessorRegex = toCombinedRegex(
    '#define',
    '#ifdef',
    '#endif',
    '#else',
    '#version\\s+[13]00\\s+es'
);

export function JSHighlighter({value, errors}: {
    value: string,
    errors?: Map<number, string[]>
}): ReactNode {
    errors ??= new Map;
    return <div className='js'>
        <HighlighterWithErrors errors={errors}>
            <CodeHighlighter rules={{
                'keyword': keywordRegex,
                'builtin-type': builtinTypeRegex,
                'builtin-func': builtinFunctionRegex,
                'builtin-var': builtinVarRegex,
                'reserved': reservedKeywordRegex,
                'literal': literalsRegex,
                'string-literal': stringLiteralRegex,
                'operator': operatorsRegex,
                'punctuation': punctuationRegex,
                'comment': commentRegex,
                'identifier': identifierRegex,
                'preprocessor': preprocessorRegex
            }}>{value}</CodeHighlighter>
        </HighlighterWithErrors>
    </div>
}