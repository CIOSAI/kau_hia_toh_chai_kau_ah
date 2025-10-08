export const vbasic = `
attribute vec4 aVertexPosition;

uniform mat4 xform;

void main() {
    gl_Position = xform*aVertexPosition;
}
`;
export const fbasic = `
uniform vec4 color;

void main() {
    gl_FragColor = color;
}
`
export const fdebug = `
void main() {
    gl_FragColor = vec4(gl_FragCoord.xy/vec2(1920.,1080.), 0, 1);
}
`
