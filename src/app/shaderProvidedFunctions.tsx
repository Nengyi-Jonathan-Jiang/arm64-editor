// language=GLSL
export const providedCode = `
    // BUILT IN DEFINITIONS PROVIDED BY PLAYGROUND 

    // Math

    const float PI = 3.141592653589793;
    const float TAU = 6.283185307179586;
    const float PHI = 1.618033988749895;
    const float E = 2.718281828459045;
    const vec2 zero2 = vec2(0);
    const vec3 zero3 = vec3(0);
    const vec4 zero4 = vec4(0);
    const vec2 one2 = vec2(1);
    const vec3 one3 = vec3(1);
    const vec4 one4 = vec4(1);

    float sqr(float v) {
        return v * v;
    }
    vec2 sqr(vec2 v) {
        return v * v;
    }
    vec3 sqr(vec3 v) {
        return v * v;
    }
    vec4 sqr(vec4 v) {
        return v * v;
    }

    float lengthSq(vec2 x) {
        return dot(x, x);
    }

    float lengthSq(vec3 x) {
        return dot(x, x);
    }

    float lengthSq(vec4 x) {
        return dot(x, x);
    }
    
    float sum(float v) {
        return v;
    }
    
    float sum(vec2 v) {
        return v.x+v.y;
    }
    
    float sum(vec3 v) {
        return v.x+v.y+v.z;
    }
    
    float sum(vec4 v) {
        return v.x+v.y+v.z+v.w;
    }

    // Matrix inverse
    float invert(float m) {
        return 1.0 / m;
    }

    mat2 invert(mat2 m) {
        return mat2(
        m[1][1], -m[0][1],
        -m[1][0], m[0][0]
        ) / (m[0][0] * m[1][1] - m[0][1] * m[1][0]);
    }

    mat3 invert(mat3 m) {
        float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];
        float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];
        float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];

        float b01 = a22 * a11 - a12 * a21;
        float b11 = -a22 * a10 + a12 * a20;
        float b21 = a21 * a10 - a11 * a20;

        float det = a00 * b01 + a01 * b11 + a02 * b21;

        return mat3(
        b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
        b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
        b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)
        ) / det;
    }

    mat4 invert(mat4 m) {
        float
        a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
        a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
        a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
        a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        return mat4(
        a11 * b11 - a12 * b10 + a13 * b09,
        a02 * b10 - a01 * b11 - a03 * b09,
        a31 * b05 - a32 * b04 + a33 * b03,
        a22 * b04 - a21 * b05 - a23 * b03,
        a12 * b08 - a10 * b11 - a13 * b07,
        a00 * b11 - a02 * b08 + a03 * b07,
        a32 * b02 - a30 * b05 - a33 * b01,
        a20 * b05 - a22 * b02 + a23 * b01,
        a10 * b10 - a11 * b08 + a13 * b06,
        a01 * b08 - a00 * b10 - a03 * b06,
        a30 * b04 - a31 * b02 + a33 * b00,
        a21 * b02 - a20 * b04 - a23 * b00,
        a11 * b07 - a10 * b09 - a12 * b06,
        a00 * b09 - a01 * b07 + a02 * b06,
        a31 * b01 - a30 * b03 - a32 * b00,
        a20 * b03 - a21 * b01 + a22 * b00
        ) / det;
    }

    // Absolute value for integers

    int absi(int x) {
        return x > 0 ? x : -x;
    }

    ivec2 absi(ivec2 v) {
        return ivec2(absi(v.x), absi(v.y));
    }

    ivec3 absi(ivec3 v) {
        return ivec3(absi(v.x), absi(v.y), absi(v.z));
    }

    ivec4 absi(ivec4 v) {
        return ivec4(absi(v.x), absi(v.y), absi(v.z), absi(v.w));
    }

    // Truncate x with the given precision

    float decimate(float x, float p) {
        return floor(x * p) / p;
    }

    vec2 decimate(vec2 x, float p) {
        return floor(x * p) / p;
    }

    vec3 decimate(vec3 x, float p) {
        return floor(x * p) / p;
    }

    vec4 decimate(vec4 x, float p) {
        return floor(x * p) / p;
    }

    // cubic interpolation

    float _builtin_cubic(float v) {
        return v * v * (3.0 - 2.0 * v);
    }
    vec2 _builtin_cubic(vec2 v) {
        return v * v * (3.0 - 2.0 * v);
    }
    vec3 _builtin_cubic(vec3 v) {
        return v * v * (3.0 - 2.0 * v);
    }
    vec4 _builtin_cubic(vec4 v) {
        return v * v * (3.0 - 2.0 * v);
    }

    float cubicMix(float A, float B, float t) {
        return A + (B - A) * _builtin_cubic(t);
    }
    vec2 cubicMix(vec2 A, vec2 B, float t) {
        return A + (B - A) * _builtin_cubic(t);
    }
    vec2 cubicMix(vec2 A, vec2 B, vec2 t) {
        return A + (B - A) * _builtin_cubic(t);
    }
    vec3 cubicMix(vec3 A, vec3 B, float t) {
        return A + (B - A) * _builtin_cubic(t);
    }
    vec3 cubicMix(vec3 A, vec3 B, vec3 t) {
        return A + (B - A) * _builtin_cubic(t);
    }
    vec4 cubicMix(vec4 A, vec4 B, float t) {
        return A + (B - A) * _builtin_cubic(t);
    }
    vec4 cubicMix(vec4 A, vec4 B, vec4 t) {
        return A + (B - A) * _builtin_cubic(t);
    }

    // The absolute value function, but with the cusp rounded to a min of n
    float almostAbs(float x, float n) {
        return sqrt(x * x + n * n);
    }

    // Integral of the builtin smoothstep function
    float integralSmoothstep(float x) {
        if (x < 0.0) return 0.0;
        if (x > 1.0) return x - 0.5;
        return x * x * x * (1.0 - x * 0.5);
    }

    // exp(-0.5 * x^2)
    float gaussian(float d, float s) {
        return exp(-(d * d) / (2.0 * s * s));
    }
    float gaussian(vec2 d, float s) {
        return exp(-lengthSq(d) / (2.0 * s * s));
    }
    float gaussian(vec3 d, float s) {
        return exp(-lengthSq(d) / (2.0 * s * s));
    }
    float gaussian(vec4 d, float s) {
        return exp(-lengthSq(d) / (2.0 * s * s));
    }

    // Abramowitz/Stegun approximation of erf(), with a maximum error of 2.5e-5
    const float _builtin_erf_p = 0.47047;
    const float _builtin_erf_a1 = 0.3480242;
    const float _builtin_erf_a2 = -0.0958798;
    const float _builtin_erf_a3 = 0.7478556;

    float erf(float x) {
        float t = 1.0 / (1.0 + _builtin_erf_p * abs(x));
        float result = 1.0 - t * (_builtin_erf_a1 + t * (_builtin_erf_a2 + t * _builtin_erf_a3)) * exp(-(x * x));
        return result * sign(x);
    }

    vec2 erf(vec2 x) {
        vec2 t = 1.0 / (1.0 + _builtin_erf_p * abs(x));
        vec2 result = 1.0 - t * (_builtin_erf_a1 + t * (_builtin_erf_a2 + t * _builtin_erf_a3)) * exp(-(x * x));
        return result * sign(x);
    }

    vec3 erf(vec3 x) {
        vec3 t = 1.0 / (1.0 + _builtin_erf_p * abs(x));
        vec3 result = 1.0 - t * (_builtin_erf_a1 + t * (_builtin_erf_a2 + t * _builtin_erf_a3)) * exp(-(x * x));
        return result * sign(x);
    }

    vec4 erf(vec4 x) {
        vec4 t = 1.0 / (1.0 + _builtin_erf_p * abs(x));
        vec4 result = 1.0 - t * (_builtin_erf_a1 + t * (_builtin_erf_a2 + t * _builtin_erf_a3)) * exp(-(x * x));
        return result * sign(x);
    }

    // Gamma function, using the Lanczos approximation, with a domain of [0, 36] and a
    // maximum relative error of 4.63e-4
    const float _builtin_gamma_g = 1.12906830989;
    const float _builtin_gamma_c0 = 0.810911930963833;
    const float _builtin_gamma_c1 = 0.480835460514268;

    float gamma(float s) {
        float s_plus_half = s + 0.5;
        float lanczos_sum = _builtin_gamma_c0 + _builtin_gamma_c1 / (s + 1.0);
        float base = (s_plus_half + _builtin_gamma_g) / E;
        return (pow(base, s_plus_half) * lanczos_sum) / s;
    }

    vec2 gamma(vec2 s) {
        vec2 s_plus_half = s + 0.5;
        vec2 lanczos_sum = _builtin_gamma_c0 + _builtin_gamma_c1 / (s + 1.0);
        vec2 base = (s_plus_half + _builtin_gamma_g) / E;
        return (pow(base, s_plus_half) * lanczos_sum) / s;
    }

    vec3 gamma(vec3 s) {
        vec3 s_plus_half = s + 0.5;
        vec3 lanczos_sum = _builtin_gamma_c0 + _builtin_gamma_c1 / (s + 1.0);
        vec3 base = (s_plus_half + _builtin_gamma_g) / E;
        return (pow(base, s_plus_half) * lanczos_sum) / s;
    }

    vec4 gamma(vec4 s) {
        vec4 s_plus_half = s + 0.5;
        vec4 lanczos_sum = _builtin_gamma_c0 + _builtin_gamma_c1 / (s + 1.0);
        vec4 base = (s_plus_half + _builtin_gamma_g) / E;
        return (pow(base, s_plus_half) * lanczos_sum) / s;
    }

    // Maps from one range to another
    float mapRange(in float v, in float inMin, in float inMax, in float outMin, in float outMax) {
        return outMin + (outMax - outMin) * (v - inMin) / (inMax - inMin);
    }
    vec2 mapRange(in vec2 v, in vec2 inMin, in vec2 inMax, in vec2 outMin, in vec2 outMax) {
        return outMin + (outMax - outMin) * (v - inMin) / (inMax - inMin);
    }
    vec3 mapRange(in vec3 v, in vec3 inMin, in vec3 inMax, in vec3 outMin, in vec3 outMax) {
        return outMin + (outMax - outMin) * (v - inMin) / (inMax - inMin);
    }
    vec4 mapRange(in vec4 v, in vec4 inMin, in vec4 inMax, in vec4 outMin, in vec4 outMax) {
        return outMin + (outMax - outMin) * (v - inMin) / (inMax - inMin);
    }

    // color space conversions, adapted from 
    //     https://github.com/tobspr/GLSL-Color-Spaces/blob/master/ColorSpaces.inc.glsl

    /*
    GLSL Color Space Utility Functions
    (c) 2015 tobspr
    
    -------------------------------------------------------------------------------
    
    The MIT License (MIT)
    
    Copyright (c) 2015
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */

    // Constants

    const float _builtin_HCV_EPSILON = 1e-10;
    const float _builtin_HSL_EPSILON = 1e-10;
    const float _builtin_HCY_EPSILON = 1e-10;

    const float _builtin_SRGB_GAMMA = 1.0 / 2.2;
    const float _builtin_SRGB_INVERSE_GAMMA = 2.2;
    const float _builtin_SRGB_ALPHA = 0.055;

    // Used to convert from linear RGB to XYZ space
    const mat3 _builtin_RGB_2_XYZ = (mat3(
    0.4124564, 0.2126729, 0.0193339,
    0.3575761, 0.7151522, 0.1191920,
    0.1804375, 0.0721750, 0.9503041
    ));

    // Used to convert from XYZ to linear RGB space
    const mat3 _builtin_XYZ_2_RGB = (mat3(
    3.2404542, -0.9692660, 0.0556434,
    -1.5371385, 1.8760108, -0.2040259,
    -0.4985314, 0.0415560, 1.0572252
    ));

    const vec3 _builtin_LUMA_COEFFS = vec3(0.2126, 0.7152, 0.0722);

    // Returns the luminance of a !! linear !! rgb color
    float get_luminance(vec3 rgb) {
        return dot(_builtin_LUMA_COEFFS, rgb);
    }

    // Converts a linear rgb color to a srgb color (approximated, but fast)
    vec3 rgb2srgb_approx(vec3 rgb) {
        return pow(rgb, vec3(_builtin_SRGB_GAMMA));
    }

    // Converts a srgb color to a rgb color (approximated, but fast)
    vec3 srgb2rgb_approx(vec3 srgb) {
        return pow(srgb, vec3(_builtin_SRGB_INVERSE_GAMMA));
    }

    // Converts a single linear channel to srgb
    float linear2srgb(float channel) {
        if (channel <= 0.0031308)
        return 12.92 * channel;
        else
        return (1.0 + _builtin_SRGB_ALPHA) * pow(channel, 1.0 / 2.4) - _builtin_SRGB_ALPHA;
    }

    // Converts a single srgb channel to rgb
    float srgb2linear(float channel) {
        if (channel <= 0.04045)
        return channel / 12.92;
        else
        return pow((channel + _builtin_SRGB_ALPHA) / (1.0 + _builtin_SRGB_ALPHA), 2.4);
    }

    // Converts a linear rgb color to a srgb color (exact, not approximated)
    vec3 rgb2srgb(vec3 rgb) {
        return vec3(
        linear2srgb(rgb.r),
        linear2srgb(rgb.g),
        linear2srgb(rgb.b)
        );
    }

    // Converts a srgb color to a linear rgb color (exact, not approximated)
    vec3 srgb2rgb(vec3 srgb) {
        return vec3(
        srgb2linear(srgb.r),
        srgb2linear(srgb.g),
        srgb2linear(srgb.b)
        );
    }

    // Converts a color from linear RGB to XYZ space
    vec3 rgb2xyz(vec3 rgb) {
        return _builtin_RGB_2_XYZ * rgb;
    }

    // Converts a color from XYZ to linear RGB space
    vec3 xyz2rgb(vec3 xyz) {
        return _builtin_XYZ_2_RGB * xyz;
    }

    // Converts a color from XYZ to xyY space (Y is luminosity)
    vec3 xyz2xyY(vec3 xyz) {
        float Y = xyz.y;
        float x = xyz.x / (xyz.x + xyz.y + xyz.z);
        float y = xyz.y / (xyz.x + xyz.y + xyz.z);
        return vec3(x, y, Y);
    }

    // Converts a color from xyY space to XYZ space
    vec3 xyY2xyz(vec3 xyY) {
        float Y = xyY.z;
        float x = Y * xyY.x / xyY.y;
        float z = Y * (1.0 - xyY.x - xyY.y) / xyY.y;
        return vec3(x, Y, z);
    }

    // Converts a color from linear RGB to xyY space
    vec3 rgb2xyY(vec3 rgb) {
        vec3 xyz = rgb2xyz(rgb);
        return xyz2xyY(xyz);
    }

    // Converts a color from xyY space to linear RGB
    vec3 xyY2rgb(vec3 xyY) {
        vec3 xyz = xyY2xyz(xyY);
        return xyz2rgb(xyz);
    }

    // Converts a value from linear RGB to HCV (Hue, Chroma, Value)
    vec3 rgb2hcv(vec3 rgb) {
        // Based on work by Sam Hocevar and Emil Persson
        vec4 P = (rgb.g < rgb.b) ? vec4(rgb.bg, -1.0, 2.0 / 3.0) : vec4(rgb.gb, 0.0, -1.0 / 3.0);
        vec4 Q = (rgb.r < P.x) ? vec4(P.xyw, rgb.r) : vec4(rgb.r, P.yzx);
        float C = Q.x - min(Q.w, Q.y);
        float H = abs((Q.w - Q.y) / (6.0 * C + _builtin_HCV_EPSILON) + Q.z);
        return vec3(H, C, Q.x);
    }

    // Converts from pure Hue to linear RGB
    vec3 hue2rgb(float hue) {
        hue = mod(hue, 1.0);
        float R = abs(hue * 6.0 - 3.0) - 1.0;
        float G = 2.0 - abs(hue * 6.0 - 2.0);
        float B = 2.0 - abs(hue * 6.0 - 4.0);
        return clamp(vec3(R, G, B), 0.0, 1.0);
    }

    // Converts from HSV to linear RGB
    vec3 hsv2rgb(vec3 hsv) {
        vec3 rgb = hue2rgb(hsv.x);
        return ((rgb - 1.0) * hsv.y + 1.0) * hsv.z;
    }

    // Converts from HSL to linear RGB
    vec3 hsl2rgb(vec3 hsl) {
        vec3 rgb = hue2rgb(hsl.x);
        float C = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
        return (rgb - 0.5) * C + hsl.z;
    }

    // Converts from HCY to linear RGB
    vec3 hcy2rgb(vec3 hcy) {
        const vec3 HCYwts = vec3(0.299, 0.587, 0.114);
        vec3 RGB = hue2rgb(hcy.x);
        float Z = dot(RGB, HCYwts);
        if (hcy.z < Z) {
            hcy.y *= hcy.z / Z;
        } else if (Z < 1.0) {
            hcy.y *= (1.0 - hcy.z) / (1.0 - Z);
        }
        return (RGB - Z) * hcy.y + hcy.z;
    }

    // Converts from linear RGB to HSV
    vec3 rgb2hsv(vec3 rgb) {
        vec3 HCV = rgb2hcv(rgb);
        float S = HCV.y / (HCV.z + _builtin_HCV_EPSILON);
        return vec3(HCV.x, S, HCV.z);
    }

    // Converts from linear rgb to HSL
    vec3 rgb2hsl(vec3 rgb) {
        vec3 HCV = rgb2hcv(rgb);
        float L = HCV.z - HCV.y * 0.5;
        float S = HCV.y / (1.0 - abs(L * 2.0 - 1.0) + _builtin_HSL_EPSILON);
        return vec3(HCV.x, S, L);
    }

    // Converts from rgb to hcy (Hue, Chroma, Luminance)
    vec3 rgb2hcy(vec3 rgb) {
        const vec3 HCYwts = vec3(0.299, 0.587, 0.114);
        // Corrected by David Schaeffer
        vec3 HCV = rgb2hcv(rgb);
        float Y = dot(rgb, HCYwts);
        float Z = dot(hue2rgb(HCV.x), HCYwts);
        if (Y < Z) {
            HCV.y *= Z / (_builtin_HCY_EPSILON + Y);
        } else {
            HCV.y *= (1.0 - Z) / (_builtin_HCY_EPSILON + 1.0 - Y);
        }
        return vec3(HCV.x, HCV.y, Y);
    }

    // RGB to YCbCr, ranges [0, 1]
    vec3 rgb2ycbcr(vec3 rgb) {
        float y = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        float cb = (rgb.b - y) * 0.565;
        float cr = (rgb.r - y) * 0.713;

        return vec3(y, cb, cr);
    }

    // YCbCr to RGB
    vec3 ycbcr2rgb(vec3 yuv) {
        return vec3(
        yuv.x + 1.403 * yuv.z,
        yuv.x - 0.344 * yuv.y - 0.714 * yuv.z,
        yuv.x + 1.770 * yuv.y
        );
    }

    // Additional conversions converting to rgb first and then to the desired
    // color space.

    // To srgb
    vec3 xyz2srgb(vec3 xyz) {
        return rgb2srgb(xyz2rgb(xyz));
    }
    vec3 xyY2srgb(vec3 xyY) {
        return rgb2srgb(xyY2rgb(xyY));
    }
    vec3 hue2srgb(float hue) {
        return rgb2srgb(hue2rgb(hue));
    }
    vec3 hsv2srgb(vec3 hsv) {
        return rgb2srgb(hsv2rgb(hsv));
    }
    vec3 hsl2srgb(vec3 hsl) {
        return rgb2srgb(hsl2rgb(hsl));
    }
    vec3 hcy2srgb(vec3 hcy) {
        return rgb2srgb(hcy2rgb(hcy));
    }
    vec3 ycbcr2srgb(vec3 yuv) {
        return rgb2srgb(ycbcr2rgb(yuv));
    }

    // To xyz
    vec3 srgb2xyz(vec3 srgb) {
        return rgb2xyz(srgb2rgb(srgb));
    }
    vec3 hue2xyz(float hue) {
        return rgb2xyz(hue2rgb(hue));
    }
    vec3 hsv2xyz(vec3 hsv) {
        return rgb2xyz(hsv2rgb(hsv));
    }
    vec3 hsl2xyz(vec3 hsl) {
        return rgb2xyz(hsl2rgb(hsl));
    }
    vec3 hcy2xyz(vec3 hcy) {
        return rgb2xyz(hcy2rgb(hcy));
    }
    vec3 ycbcr2xyz(vec3 yuv) {
        return rgb2xyz(ycbcr2rgb(yuv));
    }

    // To xyY
    vec3 srgb2xyY(vec3 srgb) {
        return rgb2xyY(srgb2rgb(srgb));
    }
    vec3 hue2xyY(float hue) {
        return rgb2xyY(hue2rgb(hue));
    }
    vec3 hsv2xyY(vec3 hsv) {
        return rgb2xyY(hsv2rgb(hsv));
    }
    vec3 hsl2xyY(vec3 hsl) {
        return rgb2xyY(hsl2rgb(hsl));
    }
    vec3 hcy2xyY(vec3 hcy) {
        return rgb2xyY(hcy2rgb(hcy));
    }
    vec3 ycbcr2xyY(vec3 yuv) {
        return rgb2xyY(ycbcr2rgb(yuv));
    }

    // To HCV
    vec3 srgb2hcv(vec3 srgb) {
        return rgb2hcv(srgb2rgb(srgb));
    }
    vec3 xyz2hcv(vec3 xyz) {
        return rgb2hcv(xyz2rgb(xyz));
    }
    vec3 xyY2hcv(vec3 xyY) {
        return rgb2hcv(xyY2rgb(xyY));
    }
    vec3 hue2hcv(float hue) {
        return rgb2hcv(hue2rgb(hue));
    }
    vec3 hsv2hcv(vec3 hsv) {
        return rgb2hcv(hsv2rgb(hsv));
    }
    vec3 hsl2hcv(vec3 hsl) {
        return rgb2hcv(hsl2rgb(hsl));
    }
    vec3 hcy2hcv(vec3 hcy) {
        return rgb2hcv(hcy2rgb(hcy));
    }
    vec3 ycbcr2hcv(vec3 yuv) {
        return rgb2hcy(ycbcr2rgb(yuv));
    }

    // To HSV
    vec3 srgb2hsv(vec3 srgb) {
        return rgb2hsv(srgb2rgb(srgb));
    }
    vec3 xyz2hsv(vec3 xyz) {
        return rgb2hsv(xyz2rgb(xyz));
    }
    vec3 xyY2hsv(vec3 xyY) {
        return rgb2hsv(xyY2rgb(xyY));
    }
    vec3 hue2hsv(float hue) {
        return rgb2hsv(hue2rgb(hue));
    }
    vec3 hsl2hsv(vec3 hsl) {
        return rgb2hsv(hsl2rgb(hsl));
    }
    vec3 hcy2hsv(vec3 hcy) {
        return rgb2hsv(hcy2rgb(hcy));
    }
    vec3 ycbcr2hsv(vec3 yuv) {
        return rgb2hsv(ycbcr2rgb(yuv));
    }

    // To HSL
    vec3 srgb2hsl(vec3 srgb) {
        return rgb2hsl(srgb2rgb(srgb));
    }
    vec3 xyz2hsl(vec3 xyz) {
        return rgb2hsl(xyz2rgb(xyz));
    }
    vec3 xyY2hsl(vec3 xyY) {
        return rgb2hsl(xyY2rgb(xyY));
    }
    vec3 hue2hsl(float hue) {
        return rgb2hsl(hue2rgb(hue));
    }
    vec3 hsv2hsl(vec3 hsv) {
        return rgb2hsl(hsv2rgb(hsv));
    }
    vec3 hcy2hsl(vec3 hcy) {
        return rgb2hsl(hcy2rgb(hcy));
    }
    vec3 ycbcr2hsl(vec3 yuv) {
        return rgb2hsl(ycbcr2rgb(yuv));
    }

    // To HCY
    vec3 srgb2hcy(vec3 srgb) {
        return rgb2hcy(srgb2rgb(srgb));
    }
    vec3 xyz2hcy(vec3 xyz) {
        return rgb2hcy(xyz2rgb(xyz));
    }
    vec3 xyY2hcy(vec3 xyY) {
        return rgb2hcy(xyY2rgb(xyY));
    }
    vec3 hue2hcy(float hue) {
        return rgb2hcy(hue2rgb(hue));
    }
    vec3 hsv2hcy(vec3 hsv) {
        return rgb2hcy(hsv2rgb(hsv));
    }
    vec3 hsl2hcy(vec3 hsl) {
        return rgb2hcy(hsl2rgb(hsl));
    }
    vec3 ycbcr2hcy(vec3 yuv) {
        return rgb2hcy(ycbcr2rgb(yuv));
    }

    // YCbCr
    vec3 srgb2ycbcr(vec3 srgb) {
        return rgb2ycbcr(srgb2rgb(srgb));
    }
    vec3 xyz2ycbcr(vec3 xyz) {
        return rgb2ycbcr(xyz2rgb(xyz));
    }
    vec3 xyY2ycbcr(vec3 xyY) {
        return rgb2ycbcr(xyY2rgb(xyY));
    }
    vec3 hue2ycbcr(float hue) {
        return rgb2ycbcr(hue2rgb(hue));
    }
    vec3 hsv2ycbcr(vec3 hsv) {
        return rgb2ycbcr(hsv2rgb(hsv));
    }
    vec3 hsl2ycbcr(vec3 hsl) {
        return rgb2ycbcr(hsl2rgb(hsl));
    }
    vec3 hcy2ycbcr(vec3 hcy) {
        return rgb2ycbcr(hcy2rgb(hcy));
    }

    // END BUILT IN DEFINITIONS PROVIDED BY PLAYGROUND
`;

export const providedNames = (
    [...providedCode.matchAll(/\w+\s+(\w+)\s*\([^)]+\)\s*\{|const\s+\w+\s+(\w+)\s*=/g)]
        .map(i => i[1] ?? i[2])
        .filter(i => !(i.startsWith('_builtin_')))
)

// TODO: implement smart inclusion of only the definitions referenced by code. Prob just by
//  matching names in client code, then in provided code we can match names in fucntion bodies
//  to figure out the dependency tree