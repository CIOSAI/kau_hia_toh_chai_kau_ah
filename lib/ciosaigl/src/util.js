import * as Trans from "./matrix.js";

const TAU = 6.2831853071;
const PI = TAU/2.0;

class Shapes {
  constructor (precision=64) {
    this.prec = precision;
  }

  circle (param={}) {
    let innerRad = 0.0;
    if (param.hasOwnProperty('innerRadius')) { innerRad = param.innerRadius; }
    
    let vertices = [];
    for (let i=-2; i<this.prec; i++) {
      if (i<0) {
	vertices.push([[1,0,0], [innerRad,0,0]][i+2]);
      }
      else {
	let amplitude = i%2==0?1:innerRad; // zigzagging
	let x = (1+i)/this.prec;
	vertices.push([Math.cos(x*TAU)*amplitude, Math.sin(x*TAU)*amplitude, 0]); 
      }
    }
    vertices.push(vertices[0]);

    return vertices;
  }

  rect (param={}) {
    return [[-1,-1,0],[-1,1,0],[1,-1,0],[1,1,0]];
  }

  capsule (param={}) {
    // TODO: rotate vertices to fit new a-b direction
    let a = [-1, 0, 0];
    let b = [1, 0, 0];
    let radius = 0.1;
    if (param.hasOwnProperty('a')) { a = param.a; }
    if (param.hasOwnProperty('b')) { b = param.b; }
    if (param.hasOwnProperty('radius')) { radius = param.radius; }
    
    let rings = Math.floor(Math.sqrt(this.prec));
    let ringDetail = Math.floor(Math.sqrt(this.prec));
    let vertices = [];

    let len = (v) => Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    let nor = (v) => {
      let l = len(v);
      return [v[0]/l, v[1]/l, v[2]/1];
    };
    let cross = (v1, v2) => {
      return [
	v1[1]*v2[2] - v1[2]-v2[1],
	v1[2]*v2[0] - v1[0]-v2[2],
	v1[0]*v2[1] - v1[1]-v2[0],
      ];
    };
    let d = nor([b[0]-a[0], b[1]-a[1], b[2]-a[2]]);
    let e = nor(cross(d, [1,0,0]));
    let f = nor(cross(e, d));
    let lookat = [...d, 0, ...e, 0, ...f, 0, 0, 0, 0, 1];

    for (let i=0; i<rings; i++) {
      for (let j=0; j<ringDetail; j++) {
	let tr = Trans.multAll([
	  Trans.xlate(a[0], a[1], a[2]),
	  Trans.scale(radius, radius, radius),
	  lookat,
	  Trans.rotX(TAU*j/ringDetail),
	]);
	let v = [0, 0, 0];

	v = [Math.cos(PI+PI*0.5*i/rings),
	     Math.sin(PI*0.5*i/rings), 0];
	v = Trans.apply(tr, v);
	vertices.push(v);
	
	v = [Math.cos(PI+PI*0.5*(i+1)/rings),
	     Math.sin(PI*0.5*(i+1)/rings), 0];
	v = Trans.apply(tr, v);
	vertices.push(v);
      }
    }
    for (let j=0; j<ringDetail; j++) {
      let ang = TAU*j/ringDetail;

      vertices.push(Trans.apply(
	Trans.multAll([Trans.xlate(a[0], a[1], a[2]), lookat]),
	[0, Math.cos(ang)*radius, Math.sin(ang)*radius]
      ));
      vertices.push(Trans.apply(
	Trans.multAll([Trans.xlate(b[0], b[1], b[2]), lookat]),
	[0, Math.cos(ang)*radius, Math.sin(ang)*radius]
      ));
    }
    for (let i=rings; i>0; i-=1) {
      for (let j=0; j<ringDetail; j++) {
	let tr = Trans.multAll([
	  Trans.xlate(b[0], b[1], b[2]),
	  Trans.scale(radius, radius, radius),
	  lookat,
	  Trans.rotX(TAU*j/ringDetail),
	]);
	let v = [0, 0, 0];

	v = [Math.cos(PI*0.5*i/rings),
	     Math.sin(PI*0.5*i/rings), 0];
	v = Trans.apply(tr, v);
	vertices.push(v);
	
	v = [Math.cos(PI*0.5*(i-1)/rings),
	     Math.sin(PI*0.5*(i-1)/rings), 0];
	v = Trans.apply(tr, v);
	vertices.push(v);
      }
    }

    return vertices;
  }
}

class Util {
  constructor (gl) {
    this.gl = gl; //webgl context
    this.fragPrefix = `precision mediump float;\n#define PI acos(-1.)\n#define TAU (PI*2.)`;
  }

  createProgram (vcode, fcode) {
    let program;
    let vert = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vert, vcode);
    this.gl.compileShader(vert);
    let frag = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(frag, `${this.fragPrefix}${fcode}`);
    this.gl.compileShader(frag);

    program = this.gl.createProgram();
    this.gl.attachShader(program, vert);
    this.gl.attachShader(program, frag);
    this.gl.linkProgram(program);
    
    return program;
  }

  pushVerts (program, floatArray) {
    let buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(floatArray), this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.gl.getAttribLocation(program, "aVertexPosition"),
      3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.gl.getAttribLocation(program, "aVertexPosition"));
  }

  flush (program, triangleCnt) {
    this.gl.useProgram(program);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, triangleCnt);
  }

  setUniform (program, type, key, value) {
    let loc = this.gl.getUniformLocation(program, key);
    if (!loc) { console.warn(`attempted to set non-existent uniform '${key}'`); }
    if (type==='float') {
      this.gl.uniform1fv(loc, new Float32Array([value]));
    }
    else if (type==='int') {
      this.gl.uniform1iv(loc, new Int32Array([value]));
    }
    else if (/^vec[2-4]$/.test(type)) {
      this.gl[`uniform${type.match(/^vec([2-4])$/)[1]}fv`](loc, new Float32Array(value));
    }
    else if (/^ivec[2-4]$/.test(type)) {
      this.gl[`uniform${type.match(/^ivec([2-4])$/)[1]}iv`](loc, new Int32Array(value));
    }
    else if (/^mat[2-4]$/.test(type)) {
      this.gl[`uniformMatrix${type.match(/^mat([2-4])$/)[1]}fv`](loc, false, new Float32Array(value));
    }
    else {
      console.warm(`unidentified type : ${type}, try float, int, vec or mat`);
    }
  }

  showAttributes (program) {
    let o = '';
    let n = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES)
    for (let i=0; i<n; i++) {
      let info = this.gl.getActiveAttrib(program, i);
      o+=`name: ${info.name}\ttype: ${info.type}\tsize: ${info.size}\n`;
    }
    console.log(o);
  }

  showUniforms (program) {
    let o = '';
    let n = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS)
    for (let i=0; i<n; i++) {
      let info = this.gl.getActiveUniform(program, i);
      o+=`name: ${info.name}\ttype: ${info.type}\tsize: ${info.size}\n`;
    }
    console.log(o);
  }
}

export { Shapes, Util, PI, TAU }
