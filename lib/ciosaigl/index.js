import * as Shaders from './src/globalGlsl.js';
import * as Trans from './src/matrix.js';
import { PI, TAU, Shapes, Util } from './src/util.js';

class CiosaiGL {
  constructor (webgl) {
    this.gl = webgl;
    this.util = new Util(webgl);
    this.basicProgram = this.util.createProgram(Shaders.vbasic, Shaders.fbasic);
    this.runningProcess = -1;
  }

  run (process, param={}) {
    if (param.hasOwnProperty['oneFrame'] && param.oneFrame) {
      process(Date.now()/1000);
    }
    else {
      this.runningProcess = setInterval(() => {
	let time = Date.now()/1000;
	process(time);
      }, 10);
    }
  }

  stop () {
    clearInterval(this.runningProcess);
  }

  xform (matrix) {
    this.util.setUniform(this.basicProgram, 'mat4', 'xform', matrix.flat());
  }

  color (vec4) {
    this.util.setUniform(this.basicProgram, 'vec4', 'color', vec4);
  }

  drawBasic (vertices) {
    this.util.pushVerts(this.basicProgram, vertices.flat());
    this.util.flush(this.basicProgram, vertices.length);
  }

  background (vec4) {
    this.xform(Trans.identity);
    this.color(vec4);
    this.drawBasic((new Shapes()).rect());
  }
}

export {CiosaiGL, Shapes, Trans};
