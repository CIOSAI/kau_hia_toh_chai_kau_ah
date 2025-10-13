export const vbasic = `
attribute vec3 aVertexPosition;

uniform mat4 xform;

void main() {
    gl_Position = xform*vec4(aVertexPosition,1);
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
