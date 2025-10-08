const TAU = 6.2831853071;
const PI = TAU/2.0;

class Shapes {
  constructor (precision=64) {
    this.prec = precision;
  }

  circle (param) {
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

  rect (param) {
    return [[-1,-1,0],[-1,1,0],[1,-1,0],[1,1,0]];
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
