import * as Trans from "./matrix.js";

const TAU = 6.2831853071;
const PI = TAU/2.0;

class Shapes {
  constructor (precision=64) {
    this.prec = precision;
  }

  circle (param={}) {
    let innerRad = 0.0;
    if (Object.hasOwn(param, 'innerRadius')) { innerRad = param.innerRadius; }
    
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
    // lookat matrix still a bit weird but ok
    let a = [-1, 0, 0];
    let b = [1, 0, 0];
    let radius = 0.1;
    if (Object.hasOwn(param, 'a')) { a = param.a; }
    if (Object.hasOwn(param, 'b')) { b = param.b; }
    if (Object.hasOwn(param, 'radius')) { radius = param.radius; }
    
    let rings = Math.floor(Math.sqrt(this.prec));
    let ringDetail = Math.floor(Math.sqrt(this.prec));
    let vertices = [];

    let len = (v) => Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    let nor = (v) => {
      let l = len(v);
      return [v[0]/l, v[1]/l, v[2]/l];
    };
    let cross = (v1, v2) => {
      return [
	v1[1]*v2[2] - v1[2]*v2[1],
	v1[2]*v2[0] - v1[0]*v2[2],
	v1[0]*v2[1] - v1[1]*v2[0],
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

class WrapProgram {
  constructor (program, vao, vertBuffer) {
    this.program = program;
    this.vao = vao;
    this.vertBf = vertBuffer;
    this.vertBfEnd = 0;
  }
}

class Util {
  constructor (gl) {
    this.gl = gl; //webgl context
    this.vaoExt = this.gl.getExtension("OES_vertex_array_object");
    this.fbs = [];
    this.fragPrefix = `precision mediump float;\n#define PI acos(-1.)\n#define TAU (PI*2.)`;
  }

  createProgram (vcode, fcode, mainProgram=true) {
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

    let bf = this.gl.createBuffer();
    if (mainProgram) {
      this.gl.disable(this.gl.DEPTH_TEST);
    }
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(1<<20), this.gl.STATIC_DRAW);

    let vao = this.vaoExt.createVertexArrayOES();
    this.vaoExt.bindVertexArrayOES(vao);
    this.gl.enableVertexAttribArray(this.gl.getAttribLocation(program, "aVertexPosition"));
    this.gl.vertexAttribPointer(this.gl.getAttribLocation(program, "aVertexPosition"),
      3, this.gl.FLOAT, false, 0, 0);

    return new WrapProgram(program, vao, bf);
  }
  
  pushTexture (param={}) {
    let width = 16;
    let height = 16;

    if (Object.hasOwn(param, "width")) {
      width = param["width"];
    }
    if (Object.hasOwn(param, "height")) {
      height = param["height"];
    }

    let fb = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
    let tex = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 
                       0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(width*height*4));

    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, tex, 0);

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    let ind = this.fbs.length;
    this.fbs.push({fb: fb, width: width, height: height});
    return ind;
  }

  setFb (who=-1) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, who<0?null:this.fbs[who].fb);
    this.gl.viewport(0,0,who<0?1920:this.fbs[who].width,who<0?1080:this.fbs[who].height);
  }

  getFb (who) {
    return this.fbs[who];
  }

  pushVerts (program, floatArray, triangleCnt) {
    let f32arr = new Float32Array(floatArray);
    this.vaoExt.bindVertexArrayOES(program.vao);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, program.vertBf);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, program.vertBfEnd, f32arr);
    let shapeLoc = program.vertBfEnd;
    program.vertBfEnd += f32arr.byteLength;
    return {loc: shapeLoc, tri: triangleCnt};
  }

  replaceVerts (program, floatArray, shape) {
    let f32arr = new Float32Array(floatArray);
    this.vaoExt.bindVertexArrayOES(program.vao);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, program.vertBf);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, shape.loc, f32arr);
  }

  flush (program, uploadedShape) {
    this.gl.useProgram(program.program);
    this.vaoExt.bindVertexArrayOES(program.vao);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, program.vertBf);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, uploadedShape.loc/3/4, uploadedShape.tri);
  }

  setUniform (program, type, key, value) {
    this.gl.useProgram(program.program);
    let loc = this.gl.getUniformLocation(program.program, key);
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
      console.warn(`unidentified type : ${type}, try float, int, vec or mat`);
    }
  }

  showAttributes (program) {
    let o = '';
    let n = this.gl.getProgramParameter(program.program, this.gl.ACTIVE_ATTRIBUTES)
    for (let i=0; i<n; i++) {
      let info = this.gl.getActiveAttrib(program.program, i);
      o+=`name: ${info.name}\ttype: ${info.type}\tsize: ${info.size}\n`;
    }
    console.log(o);
  }

  showUniforms (program) {
    let o = '';
    let n = this.gl.getProgramParameter(program.program, this.gl.ACTIVE_UNIFORMS)
    for (let i=0; i<n; i++) {
      let info = this.gl.getActiveUniform(program.program, i);
      o+=`name: ${info.name}\ttype: ${info.type}\tsize: ${info.size}\n`;
    }
    console.log(o);
  }
}

export { Shapes, Util, PI, TAU }
