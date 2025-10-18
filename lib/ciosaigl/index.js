import * as Shaders from './src/globalGlsl.js';
import * as Trans from './src/matrix.js';
import { PI, TAU, Shapes, Util } from './src/util.js';

class CiosaiGL {
  constructor (webgl) {
    this.gl = webgl;
    this.util = new Util(webgl);
    this.basicProgram = this.util.createProgram(Shaders.vbasic, Shaders.fbasic);
    this.running = false;
    this.backgroundRect;
  }

  run (process, param={}) {
    let render = (now) => {
      process(now/1000);
      if (!this.running) { return; }
      requestAnimationFrame(render);
    }
    if (Object.hasOwn(param, 'oneFrame') && param.oneFrame) {
      requestAnimationFrame(render);
      this.running = false;
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
