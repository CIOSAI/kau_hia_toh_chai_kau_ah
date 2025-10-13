import { CiosaiGL, Trans, Shapes } from "./lib/ciosaigl/index.js";
import { Metro } from "./src/metro.js";

let canvas = document.getElementById('the-canvas');
let startButton = document.getElementById('start');

let gl = canvas.getContext('webgl', { premultipliedAlpha: false });

let ciosaigl = new CiosaiGL(gl);
let metro = new Metro(ciosaigl);

function start() {
  canvas.requestFullscreen();

  const RED = [0.9,0.1,0.2,1];
  const BLUE = [0.1,0.5,0.9,1];
  const GREEN = [0.1,0.8,0.3,1];
  const YELLOW = [0.8,0.7,0.1,1];

  metro.entireLine(RED, ['Yuanshan', 'Minquan W. Rd.', 'Shuanglian', 'Zhongshan', 'Taipei Main', 'NTU Hospital', 'Chiang Kai-shek Memorial Hall', 'Dongmen', 'Daan Park']);
  metro.entireLine(YELLOW, ['Daqiaotou', 'Minquan W. Rd.', 'Zhongshan Elementary School', 'Xingtian Temple', 'Songjiang Nanjing', 'Zhongxiao Xinsheng', 'Dongmen', 'Guting', 'Dingxi']);
  metro.entireLine(GREEN, ['Nanjing Fuxing', 'Songjiang Nanjing', 'Zhongshan', 'Beimen', 'Ximen', 'Xiaonanmen', 'Chiang Kai-shek Memorial Hall', 'Guting', 'Taipower Building']);
  metro.entireLine(BLUE, ['Longshan Temple', 'Ximen', 'Taipei Main', 'Shandao Temple', 'Zhongxiao Xinsheng', 'Zhongxiao Fuxing']);

  ciosaigl.noop();
  ciosaigl.run((time)=>{
    ciosaigl.background([0.95,0.95,0.95,1]);

    metro.physics({attract: .0005, repulse: 0.0004, slippy: 0.8});
    metro.render();
  }, {oneFrame: false});
}

//startButton.onclick = (e)=>{start();};
start();
