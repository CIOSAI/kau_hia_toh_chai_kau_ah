import * as Shaders from './src/globalGlsl.js';
import * as Trans from './src/matrix.js';
import { Shapes, Util } from './src/util.js';

class CiosaiGL {
  constructor (webgl) {
    this.gl = webgl;
    this.util = new Util(webgl);
    this.basicProgram = this.util.createProgram(Shaders.vbasic, Shaders.fbasic);
    this.desiredFrameRate = 60 +10;
    this.running = false;
    this.backgroundRect;
  }

  run (process, param={}) {
    let lastTime = Date.now();
    let render = (now /* this is since the page was opened */) => {
      if (this.running) {
	requestAnimationFrame(render);
      }

      let noww = Date.now(); // this is in unix
      let elapsed = (noww-lastTime)/1000;
      if (this.desiredFrameRate>0) {
	if (elapsed>1.0/this.desiredFrameRate) {
	  process(now/1000);
	  lastTime = noww - (elapsed%(1.0/this.desiredFrameRate));
	}
      }
      else {
	process(now/1000);
	lastTime = noww;
      }
      //console.log(`frameRate : ${1.0 / Math.max(0.0000001, elapsed)}`);
    }
    if (Object.hasOwn(param, 'oneFrame') && param.oneFrame) {
      this.running = false;
      requestAnimationFrame(render);
    }
    else {
      this.running = true;
      requestAnimationFrame(render);
    }
  }

  stop () {
    this.running = false;
  }

  xform (matrix) {
    this.util.setUniform(this.basicProgram, 'mat4', 'xform', matrix.flat());
  }

  color (vec4) {
    this.util.setUniform(this.basicProgram, 'vec4', 'color', vec4);
  }

  setUniform (program, list) {
    for (let item of list) {
      this.util.setUniform(program, item.type, item.key, item.value);
    }
  }

  initFb (param) {
    return this.util.pushTexture(param);
  }

  useFb (ind=-1) {
    this.util.setFb(ind);
  }

  getFb (ind) {
    this.util.getFb(ind);
  }

  initShader (fShader, vShader=Shaders.vbasic) {
    return this.util.createProgram(vShader, fShader, false);
  }

  initShape (vertices, program=this.basicProgram) {
    return this.util.pushVerts(program, vertices.flat(), vertices.length);
  }

  modifyShape (shape, vertices, program=this.basicProgram) {
    this.util.replaceVerts(program, vertices.flat(), shape);
    return shape;
  }

  drawShape (shape, program=this.basicProgram) {
    this.util.flush(program, shape);
  }

  background (vec4) {
    this.xform(Trans.identity);
    this.color(vec4);
    if (!this.backgroundRect) {
      this.backgroundRect = this.initShape((new Shapes()).rect());
    }
    this.drawShape(this.backgroundRect);
  }
}

export {CiosaiGL, Shapes, Trans, Shaders};
