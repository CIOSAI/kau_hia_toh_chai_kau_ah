import * as Shaders from '/src/globalGlsl.js';
import * as Trans from '/src/matrix.js';
import { PI, TAU, Shapes, Util } from '/src/util.js';

let canvas = document.getElementById('the-canvas');
let startButton = document.getElementById('start');

let gl = canvas.getContext('webgl', { premultipliedAlpha: false });

let shapeMaker = new Shapes();
let utilObj = new Util(gl);

let program = utilObj.createProgram(Shaders.vbasic, Shaders.fdebug);

utilObj.showAttributes(program);
utilObj.showUniforms(program);

function start() {
  canvas.requestFullscreen();
  setInterval(() => {
    let time = Date.now()/1000;
    let vertices = time%1<0.5?shapeMaker.circle({innerRadius: 0.5}):shapeMaker.rect();
    utilObj.pushVerts(program, vertices.flat());
    let tr = Trans.multAll([
        Trans.scale(9/16,1,1),
        Trans.xlate(Math.cos(time*2.2)*.5, Math.sin(time*1.9)*.5, 0),
        Trans.scale(0.2,0.2,0.2),
        Trans.rotZ(time),
      ]);
    utilObj.setUniform(program, 'mat4', 'xform', tr.flat());
    //utilObj.setUniform(program, 'vec4', 'color', [Math.sin(time)*0.5+0.5,0,0,1]);
    utilObj.flush(program, vertices.length);
  }, 10);
}

//startButton.onclick = (e)=>{start();};
start();
