export const vbasic = `
uniform mat4 xform;

void main() {
    gl_Position = xform*vec4(aVertexPosition,1);
}
`;
export const fbasic = `
uniform vec4 color;

void main() {
    FragColor = color;
}
`
export const fdebug = `
void main() {
    FragColor = vec4(gl_FragCoord.xy/vec2(1920.,1080.), 0, 1);
}
`
export const fbeep = `
uniform float sampleRate;
uniform float pitch;
uniform float volume;

vec2 song(float t) {
    float v = sin(t*pitch*TAU) * exp(-t*11.) * volume;
    return max(vec2(0.0), min(vec2(1.0), vec2(v)*0.5+0.5));
}

void main() {
    vec4 c;
    if (gl_FragCoord.y<0.5) {
      c.x = song(gl_FragCoord.x*4./sampleRate).x;
      c.y = song((gl_FragCoord.x*4.+1.)/sampleRate).x;
      c.z = song((gl_FragCoord.x*4.+2.)/sampleRate).x;
      c.w = song((gl_FragCoord.x*4.+3.)/sampleRate).x;
    }
    else {
      c.x = song(gl_FragCoord.x*4./sampleRate).y;
      c.y = song((gl_FragCoord.x*4.+1.)/sampleRate).y;
      c.z = song((gl_FragCoord.x*4.+2.)/sampleRate).y;
      c.w = song((gl_FragCoord.x*4.+3.)/sampleRate).y;
    }
    FragColor = c;
}
`
