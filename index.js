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
  const BROWN = [0.4,0.115,0.1,1];

  let tamsuiXinyi = metro.entireLine(RED, [10, 1, 11, 2, 3, 12, 4, 5, 13, 26, 50, 51, 52]);
  let zhongheXinlu = metro.entireLine(YELLOW, [14, 1, 15, 16, 6, 7, 5, 9, 17, 61, 62, 63]);
  let songshanXindian = metro.entireLine(GREEN, [64, 65, 66, 18, 6, 2, 19, 8, 20, 4, 9, 21, 47, 48, 49, 67, 68, 69, 70]);
  let wenhu = metro.entireLine(BROWN, [39, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 25, 18, 24, 26, 53, 54, 55, 56, 57, 58, 59, 60]);
  let bannan = metro.entireLine(BLUE, [22, 8, 3, 23, 7, 24, 40, 41, 42, 43, 44, 45, 46, 39]);

  function fract(n) { return n-Math.floor(n); }
  function genNoteGroup(seed, amt) {
    if (amt<1) { console.warn(`unable to make note group of length ${amt}, make sure amt is a positive integer`); return [0, 1, 2]; }
    let group = [seed];
    let stride = amt;
    for (let i=0; i<amt; i++) {
      let nextNote = group[group.length-1]+stride+Math.round(Math.sin(seed*8+stride));
      if (group.length < 5) {
	nextNote = nextNote % 17;
      }
      if (group.length < 9) {
	nextNote = nextNote % 34;
      }
      group.push(nextNote);
      stride = Math.max(1, stride-1);
    }
    return group;
  }
  function melody(seed, selection) {
    let r = fract(Math.sin(seed*131.933)*466.462);
    return selection[Math.floor(r*selection.length)];
  }
  const mainScale = genNoteGroup(8, 5);

  metro.createTrain(RED, tamsuiXinyi[0], {
    name: 'bell',
    fragment: `
    vec2 song(float t) {
      float v = sin(t*pitch*TAU) * exp(-t*11.) * volume;
      return vec2(v); 
    }`,
    trigger: (station)=>[
      {type: 'float', key: 'pitch', value: Beeper.tet(17, melody(station.name, mainScale))},
      {type: 'float', key: 'volume', value: 0.1}]
    }, 0.05);
  metro.createTrain(BLUE, bannan[0], {
    name: 'waa',
    fragment: `
    vec2 song(float t) {
      float v = sign(sin(t*pitch*TAU)) * smoothstep(0.0, 0.15, t) * exp(-t*3.) * volume;
      return vec2(v); 
    }`,
    trigger: (station)=>[
      {type: 'float', key: 'pitch', value: Beeper.tet(17, -34+melody(station.name, mainScale))},
      {type: 'float', key: 'volume', value: 0.1}]
    }, 0.015);
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
      {type: 'float', key: 'volume', value: 0.02+Math.random()*0.05}]
    }, 0.04);
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
      {type: 'float', key: 'volume', value: 0.25}]
    }, 0.01);
  metro.createTrain(BROWN, wenhu[0], {
    name: 'silly',
    fragment: `
    vec2 song(float t) {
      float v = sin(t*pitch*TAU) * exp(-t*21.) * volume;
      return vec2(v); 
    }`,
    trigger: (station)=>[
      {type: 'float', key: 'pitch', value: Beeper.tet(17, 17+melody(station.name, mainScale))},
      {type: 'float', key: 'volume', value: 0.05}]
    }, 0.1);

  let tpMain = metro.stations.filter(station=>station.name===4)[0];

  ciosaigl.run((time)=>{
    ciosaigl.background([0.95,0.95,0.95,1]);

    // pretty good ratio {attract: .064, repulse: 0.0006, slippy: 0.8}
    metro.physics({attract: .064, repulse: 0.0001, slippy: 0.6});
    metro.runTrain(0.01);
    tpMain.velx -= tpMain.x*.1;
    tpMain.vely -= tpMain.y*.1;
    metro.render();
  }, {oneFrame: false});
}

//startButton.onclick = (e)=>{start();};
start();
