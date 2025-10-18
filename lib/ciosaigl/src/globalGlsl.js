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
    float v = sin(t*pitch*TAU) * (1.0-t) * volume;
    return vec2(v);
}

void main() {
    FragColor = vec4(
    	song(gl_FragCoord.x*2./sampleRate), 
	song((gl_FragCoord.x*2.+1.)/sampleRate)
	);
}
`
