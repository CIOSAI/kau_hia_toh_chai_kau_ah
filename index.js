import { CiosaiGL } from "./lib/ciosaigl/index.js";
import { Metro } from "./src/metro.js";
import { Beeper } from "./src/audio.js";
import * as ShowText from "./src/text.js";
import * as Matrix from "./lib/ciosaigl/src/matrix.js";

let canvas = document.getElementById('the-canvas');
let startButton = document.getElementById('start');

let gl = canvas.getContext('webgl2', { premultipliedAlpha: false });

let ciosaigl = new CiosaiGL(gl);
let metro = new Metro(ciosaigl, new Beeper(ciosaigl));

function start() {
  startButton.style.display = 'none';
  document.body.requestFullscreen();

  const RED = [0.9,0.1,0.2,1];
  const BLUE = [0.1,0.5,0.9,1];
  const GREEN = [0.1,0.8,0.3,1];
  const ORANGE = [0.95,0.6,0.1,1];
  const YELLOW = [0.9,0.85,0.0,1];
  const BROWN = [0.6,0.115,0.1,1];

  function fract(n) { return n-Math.floor(n); }
  function mix(a,b,c) { return a+(b-a)*c; }
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

  let tamsuiXinyi = metro.entireLine(RED, [2, 3, 12]);
  let bannan;
  let songshanXindian;
  let wenhu;
  let zhongheXinlu;
  let circleLine;

  let kickEffects = {
    tug: false,
    tugForce: 0.4,
  };
  let trainSlowing = false;

  let titleHan = ShowText.createText('«到遐就知到矣»');
  let titleLtn = ShowText.createText('"Kàu hia to̍h chai kàu ah"');
  let authorHan = ShowText.createText('石獅 作');
  let authorLtn = ShowText.createText('presented by CIOSAI');
  let inviteHan = ShowText.createText('請汝做伙來-');
  let inviteLtn = ShowText.createText('you\'ve been invited to join-');
  let partyInfoHan = ShowText.createText('台北 / 一月 17 / 運算子數位藝術節');
  let partyInfoLtn = ShowText.createText('Taipei / JAN 17 / Operator Digitalfest', 64);

  setInterval(()=>{
    if (!trainSlowing) {return;}
    for (let train of metro.trains) {
      train.speed *= 0.95;
    }
  }, 200);

  let trainRed1 = metro.createTrain(RED, tamsuiXinyi[0], {
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
  
  function addSeries(list, line, delay, interval, invert=false) {
    setTimeout(()=>{
      let i = 0;
      let timerId = setInterval(()=>{
	invert?
	  metro.entireLine(line, [list[i+1], list[i]]):
	  metro.entireLine(line, [list[i], list[i+1]]);
	i += 1;
	if (i+1>=list.length) { clearInterval(timerId); }
      }, interval);
    }, delay);
  }

  addSeries([12, 4, 5, 13, 26, 50, 51, 52], RED, 2000, 3000);
  
  setTimeout(()=>{
    bannan = [metro.stations.find(station=>station.name===3)];
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
  }, 10*1000);

  addSeries([3, 23, 7, 24, 40, 41, 42, 43, 44, 45, 46, 39], BLUE, 10*1000, 4300);
  addSeries([3, 8, 22, 107, 106, 105, 104, 103, 102, 101, 100, 99], BLUE, 11*1000, 5900, true);
  
  addSeries([2, 11, 1, 10, 89, 88, 87, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76], RED, 20*1000, 800, true);
  
  setTimeout(()=>{
    songshanXindian = [metro.stations.find(station=>station.name===2)];
    metro.createTrain(GREEN, songshanXindian[0], {
      name: 'kick',
      fragment: `
  float expease(float n, float deg) {
      return n>0.0?1.0-exp(-n*deg):0.0;
  }
      vec2 song(float t) {
	float v = tanh(sin(1700.*t-expease(t,4.)*600.)*mix(5.,2.,t)) * exp(-t*16.) * volume;
	return vec2(v); 
      }`,
      trigger: (station)=>{
	if (kickEffects.tug) {
	  const SAMPLES = 32;
	  let dir = {
	    x: Math.random()*2-1,
	    y: Math.random()*2-1
	  };
	  let l = Math.sqrt(dir.x*dir.x+dir.y*dir.y);
	  dir.x /= l;
	  dir.y /= l;

	  for (let i=0; i<SAMPLES; i++) {
	    let sta = metro.stations[Math.floor(Math.random()*metro.stations.length)];
	    sta.x += dir.x*kickEffects.tugForce;
	    sta.y += dir.y*kickEffects.tugForce;
	  }
	}
	return [
	  {type: 'float', key: 'volume', value: 0.25}
	];
      }
    }, 0.01);
  }, 20*1000);

  addSeries([2, 19, 8, 20, 4, 9, 21, 47, 48, 49, 67, 68, 69, 70], GREEN, 20*1000, 1200);
  addSeries([2, 6, 18, 66, 65, 64], GREEN, 20*1000, 1500, true);

  setTimeout(()=>{
    wenhu = [metro.stations.find(station=>station.name===26)];
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
  }, 27*1000);

  addSeries([26, 24, 18, 25, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 39], BROWN, 27*1000, 800);
  addSeries([26, 53, 54, 55, 56, 57, 58, 59, 60], BROWN, 27*1000, 1900, true);

  setTimeout(()=>{
    zhongheXinlu = [metro.stations.find(station=>station.name===1)];
    metro.createTrain(ORANGE, zhongheXinlu[0], {
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
  }, 35*1000);

  addSeries([1, 15, 16, 6, 7, 5, 9, 17, 61, 62, 63], ORANGE, 35*1000, 600);
  addSeries([1, 14, 75, 74, 73, 72, 71], ORANGE, 37*1000, 600, true);
  addSeries([14, 98, 97, 96, 95, 94, 93, 92, 91, 90], ORANGE, 39*1000, 600, true);

  setTimeout(()=>{
    kickEffects.tug = true;
  }, 40*1000);

  setTimeout(()=>{
    circleLine = [metro.stations.find(station=>station.name===106)];
    metro.createTrain(YELLOW, circleLine[0], {
      name: 'goofy',
      fragment: `
      vec2 song(float t) {
	vec2 v = sign(sin(vec2(sin(t*87.),cos(t*42.))+t*pitch*TAU)) * exp(-t*4.) * volume;
	return v; 
      }`,
      trigger: (station)=>[
	{type: 'float', key: 'pitch', value: Beeper.tet(17, melody(station.name, mainScale))},
	{type: 'float', key: 'volume', value: 0.02}]
      }, 0.03);
  }, 40*1000);
  addSeries([106, 94, 109, 108], YELLOW, 40*1000, 1600, true);
  addSeries([106, 105, 110, 111, 112, 113, 62, 114, 115, 116, 67], YELLOW, 41*1000, 1600);

  let stashConnections = [];
  let stashSpeeds = [];
  setTimeout(()=>{
    let cutAmount = metro.connections.length*0.5;
    for (let i=0; i<cutAmount; i++) {
      let cutPosition = Math.floor(Math.random()*(metro.connections.length-1));
      stashConnections.push(metro.connections[cutPosition]);
      metro.connections = metro.connections.slice(0, cutPosition
	).concat(metro.connections.slice(cutPosition+1));
    }

    trainSlowing = true;
    for (let train of metro.trains) {
      stashSpeeds.push({train: train, speed: train.speed});
    }
  }, 60*1000);

  setTimeout(()=>{
    let connection = stashConnections.pop();
    while (connection) {
      metro.connections.push(connection);
      connection = stashConnections.pop();
    }
    
    trainSlowing = false;
    for (let train of metro.trains) {
      train.speed = stashSpeeds.find(record=>record.train===train).speed;
    }
  }, 80*1000);

  setTimeout(()=>{
    ShowText.addToRack(titleHan);
    ShowText.addToRack(titleLtn);
  }, 61*1000);
  setTimeout(()=>{
    ShowText.addToRack(authorHan);
    ShowText.addToRack(authorLtn);
  }, 63*1000);
  setTimeout(()=>{
    titleHan.style.display = 'none';
    titleLtn.style.display = 'none';
    authorHan.style.display = 'none';
    authorLtn.style.display = 'none';
  }, 68*1000);

  setTimeout(()=>{
    ShowText.addToRack(inviteHan);
    ShowText.addToRack(inviteLtn);
  }, 70*1000);
  setTimeout(()=>{
    inviteHan.style.display = 'none';
    inviteLtn.style.display = 'none';
    ShowText.addToRack(partyInfoHan);
    ShowText.addToRack(partyInfoLtn);
  }, 73*1000);
  setTimeout(()=>{
    let randSwapWith = (text, a) => {
      let ind = Math.floor(Math.random()*text.length);
      if (ind===text.length-1) {
	return text.slice(0,ind)+a;
      }
      else {
	return text.slice(0,ind)+a+text.slice(ind+1);
      }
    };
    let count = 60;
    let glitchOut = setInterval(()=>{
      if (partyInfoHan.textContent.length<99 && Math.random()<0.1) {
	partyInfoHan.textContent = partyInfoHan.textContent.repeat(2);
	partyInfoLtn.textContent = partyInfoLtn.textContent.repeat(2);
      }
      partyInfoHan.textContent = randSwapWith(partyInfoHan.textContent, '→');
      partyInfoLtn.textContent = randSwapWith(partyInfoLtn.textContent, '→');
      partyInfoHan.style.opacity = count/60;
      partyInfoLtn.style.opacity = count/60;
      count -= 1;
      if (count<=0) {
	clearInterval(glitchOut);
	partyInfoHan.style.display = 'none';
	partyInfoLtn.style.display = 'none';
	partyInfoHan.style.opacity = 1;
	partyInfoLtn.style.opacity = 1;
      }
    },150);
  }, 80*1000);

  ciosaigl.run((time)=>{
    ciosaigl.background([0.95,0.95,0.95,1]);

    // pretty good ratio {attract: .064, repulse: 0.0006, slippy: 0.8}
    metro.physics({attract: 0.01, repulse: 0.00022, slippy: 0.6});
    metro.runTrain(0.01);

    let zoom = 1;
    if (time<10) {
      zoom = 5;
    }
    else if (time<30) {
      let perc = (time-10)/20;
      zoom = mix(5, 0.75, Math.pow(perc,0.3));
    }
    else {
      zoom = 0.75;
    }
    let xlate = {x: 0, y:0};
    if (time<10) {
      xlate.x = -mix(trainRed1.fromSta.x, trainRed1.toSta.x, trainRed1.perc);
      xlate.y = -mix(trainRed1.fromSta.y, trainRed1.toSta.y, trainRed1.perc);
    }
    else if (time<50) {
      let perc = (time-10)/40;
      perc = 1-Math.pow(perc, 0.6);
      xlate.x = -mix(trainRed1.fromSta.x, trainRed1.toSta.x, trainRed1.perc) * perc;
      xlate.y = -mix(trainRed1.fromSta.y, trainRed1.toSta.y, trainRed1.perc) * perc;
    }
    else {
      xlate.x = 0;
      xlate.y = 0;
    }
    let followRed = Matrix.multAll([
      Matrix.scale(zoom,zoom,1),
      Matrix.xlate(xlate.x, xlate.y, 0),
    ]);

    metro.render(followRed);
  }, {oneFrame: false});
}

startButton.onclick = (e)=>{start();};
//start();
