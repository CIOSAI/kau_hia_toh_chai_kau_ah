import { CiosaiGL } from "./lib/ciosaigl/index.js";
import { Metro } from "./src/metro.js";
import { Beeper } from "./src/audio.js";

let canvas = document.getElementById('the-canvas');
let startButton = document.getElementById('start');

let gl = canvas.getContext('webgl2', { premultipliedAlpha: false });

let ciosaigl = new CiosaiGL(gl);
let metro = new Metro(ciosaigl, new Beeper(ciosaigl));

function start() {
  canvas.requestFullscreen();

  const RED = [0.9,0.1,0.2,1];
  const BLUE = [0.1,0.5,0.9,1];
  const GREEN = [0.1,0.8,0.3,1];
  const YELLOW = [0.8,0.7,0.1,1];

  let tamsuiXinyi = metro.entireLine(RED, ['Yuanshan', 'Minquan W. Rd.', 'Shuanglian', 'Zhongshan', 'Taipei Main', 'NTU Hospital', 'Chiang Kai-shek Memorial Hall', 'Dongmen', 'Daan Park']);
  let zhongheXinlu = metro.entireLine(YELLOW, ['Daqiaotou', 'Minquan W. Rd.', 'Zhongshan Elementary School', 'Xingtian Temple', 'Songjiang Nanjing', 'Zhongxiao Xinsheng', 'Dongmen', 'Guting', 'Dingxi']);
  let songshanXindian = metro.entireLine(GREEN, ['Nanjing Fuxing', 'Songjiang Nanjing', 'Zhongshan', 'Beimen', 'Ximen', 'Xiaonanmen', 'Chiang Kai-shek Memorial Hall', 'Guting', 'Taipower Building']);
  let bannan = metro.entireLine(BLUE, ['Longshan Temple', 'Ximen', 'Taipei Main', 'Shandao Temple', 'Zhongxiao Xinsheng', 'Zhongxiao Fuxing']);
  
  metro.createTrain(RED, tamsuiXinyi[0], {
    name: 'bell',
    fragment: `
    vec2 song(float t) {
      float v = sin(t*pitch*TAU) * exp(-t*11.) * volume;
      return vec2(v); 
    }`,
    trigger: (station)=>[
      {type: 'float', key: 'pitch', value: Beeper.tet(17, Math.floor(Math.random()*17))},
      {type: 'float', key: 'volume', value: 0.2}]
    }, 0.01);
  metro.createTrain(BLUE, bannan[0], {
    name: 'waa',
    fragment: `
    vec2 song(float t) {
      float v = sign(sin(t*pitch*TAU)) * smoothstep(0.0, 0.15, t) * exp(-t*11.) * volume;
      return vec2(v); 
    }`,
    trigger: (station)=>[
      {type: 'float', key: 'pitch', value: Beeper.tet(17, -17+Math.floor(Math.random()*17))},
      {type: 'float', key: 'volume', value: 0.1}]
    }, 0.02);
  metro.createTrain(GREEN, songshanXindian[0], {
    name: 'hat',
    fragment: `
vec3 hash( uvec3 x )
{
    x = ((x>>8U)^x.yzx)*1103773245U;
    x = ((x>>8U)^x.yzx)*1103773245U;
    x = ((x>>8U)^x.yzx)*1103773245U;

    return vec3(x)*(1.0/float(0xffffffffU));
}
vec3 hash3f( vec3 x )
{
    return hash(uvec3(x*66456.85725));
}
vec2 spray( float t, float freq, float spread, float seed, float interval, int count) {
  float grainLength = float(count) * interval;
  vec2 sum = vec2(0);
  for(float i = 0.; i < float(count)+0.5; i++) {
    vec3 dice = hash3f(vec3(i, floor((float(t) -interval * i) / grainLength), seed));
        vec2 ph = 6.283 * vec2(freq * t * exp2(spread * sqrt(-2. * log(dice.x)) * vec2(cos(6.283*dice.y), sin(6.283*dice.y))) + dice.xy);
    sum += 
            2. * 
            smoothstep(0., .5, mod(float(t) -interval * i, grainLength) / grainLength) * 
            smoothstep(1., .5, mod(float(t) -interval * i, grainLength) / grainLength) * 
            vec2(sin(ph.x),sin(ph.y));
  }
  return sum / float(count);
}
    vec2 song(float t) {
      vec2 v = tanh(spray(t, 9900., .8, 3., 1., 64)*4.) * exp(-t*18.) * volume;
      return vec2(v); 
    }`,
    trigger: (station)=>[
      {type: 'float', key: 'volume', value: 0.05+Math.random()*0.1}]
    }, 0.015);
  metro.createTrain(YELLOW, zhongheXinlu[0], {
    name: 'kick',
    fragment: `
float expease(float n, float deg) {
    return n>0.0?1.0-exp(-n*deg):0.0;
}
    vec2 song(float t) {
      float v = tanh(sin(1700.*t-expease(t,4.)*600.)*mix(5.,2.,t)) * exp(-t*16.) * volume;
      return vec2(v); 
    }`,
    trigger: (station)=>[
      {type: 'float', key: 'volume', value: 0.2}]
    }, 0.007);

  let tpMain = metro.stations.filter(station=>station.name==='Taipei Main')[0];

  ciosaigl.run((time)=>{
    ciosaigl.background([0.95,0.95,0.95,1]);

    // pretty good ratio {attract: .064, repulse: 0.0006, slippy: 0.8}
    metro.physics({attract: .064, repulse: 0.0006, slippy: 0.8});
    metro.runTrain(0.01);
    tpMain.velx -= tpMain.x*.1;
    tpMain.vely -= tpMain.y*.1;
    metro.render();
  }, {oneFrame: false});
}

//startButton.onclick = (e)=>{start();};
start();
