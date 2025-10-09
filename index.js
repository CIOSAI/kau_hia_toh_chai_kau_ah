import { CiosaiGL, Trans, Shapes } from "./lib/ciosaigl/index.js";
import { Metro } from "./src/metro.js";

let canvas = document.getElementById('the-canvas');
let startButton = document.getElementById('start');

let gl = canvas.getContext('webgl', { premultipliedAlpha: false });

let ciosaigl = new CiosaiGL(gl);
let metro = new Metro(ciosaigl);

function start() {
  canvas.requestFullscreen();

  const RED = [1,0,0,1];
  const BLUE = [0,0,1,1];

  let a = metro.createStation('Zhongshan', RED);
  let b = metro.createStation('Taipei Main', RED);
  metro.createConnection(a, b, RED);
  a = metro.createStation('NTU Hospital', RED);
  metro.createConnection(b, a, RED);

  a = metro.createStation('Shandao Temple', BLUE);
  metro.createConnection(b, a, BLUE);
  a = metro.createStation('Ximen', BLUE);
  metro.createConnection(a, b, BLUE);

  ciosaigl.run((time)=>{
    ciosaigl.background([0,0.3,0.3,1]);

    metro.physics({attract: .002, repulse: 0.001, slippy: 0.8});
    metro.render();
  });
}

//startButton.onclick = (e)=>{start();};
start();
