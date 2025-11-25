import { Trans, Shapes } from "/lib/ciosaigl/index.js";

class Station {
  constructor (x, y, name, color) {
    this.x = x;
    this.y = y;
    this.velx = 0;
    this.vely = 0;
    this.name = name;
    this.colors = [color];
  }

  toVec4 () {
    return [this.x, this.y, 0, 1];
  }
}

class Train {
  constructor (color, synth, trigger, speed, startingStation) {
    this.line = color; 
    this.instrument = synth;
    this.trigger = trigger;
    this.speed = speed;
    this.fromSta = startingStation;
    this.toSta = startingStation;
    this.forward = true;
    this.perc = 0.0;
    this.sz = 1.0;
  }

  static ORIGINAL_SZ = 0.02;
  static BOP_AMOUNT = 0.5;
  static BOP_FALLOFF = 0.65;
}

export class Metro {
  constructor (ciosaigl, beeper) {
    this.ciosaigl = ciosaigl;
    this.beeper = beeper;
    this.shapeMaker = new Shapes(16);
    this.stations = [];
    this.connections = [];
    this.trains = [];
    this.shapes = {};
    
    console.log(this.ciosaigl.gl.getParameter(this.ciosaigl.gl.SHADING_LANGUAGE_VERSION));
    console.log(this.ciosaigl.gl.getParameter(this.ciosaigl.gl.VERSION));
  }

  createStation (name, color) {
    let station = new Station(Math.random()-0.5, Math.random()-0.5, name, color);
    this.stations.push(station);
    return station;
  }

  createConnection (a, b, color, spreadColor=false) {
    this.connections.push({nodes: [a, b], color: color});
    if (spreadColor) {
      if (!a.colors.includes(color)) { a.colors.push(color); }
      if (!b.colors.includes(color)) { b.colors.push(color); }
    }
  }

  createTrain (color, startingStation, instrument, speed=0.01) {
    let train = new Train(
      color,
      this.beeper.initSynth(instrument.name, instrument.fragment),
      instrument.trigger,
      speed,
      startingStation,
    );
    this.trains.push(train);
    this.setTrainRoute(train);
    return train;
  }

  setTrainRoute (train) {
    let nextSta = this.connections.find(connection=>
      connection.color===train.line &&
      connection.nodes[train.forward?0:1]===train.fromSta
    );
    if (nextSta) {
      train.toSta = nextSta.nodes[train.forward?1:0];
      return true;
    }
    return false;
  }

  runTrain () {
    for (let train of this.trains) {
      train.perc += train.speed;
      if (train.perc<0) { train.perc = 0; }
      if (train.perc>1) {
	this.beeper.play(train.instrument, train.trigger(train.toSta));
	train.sz += Train.BOP_AMOUNT;
	train.perc -= Math.floor(train.perc);
	train.fromSta = train.toSta;
	let hasNext = this.setTrainRoute(train);
	if (!hasNext) {
	  train.forward = !train.forward;
	  this.setTrainRoute(train);
	}
      }
    }
  }

  entireLine (color, list) {
    let stationList = [];
    let exists = this.stations.find(s=>s.name===list[0]);
    let station = exists?exists:this.createStation(list[0], color);
    stationList.push(station);
    
    for (let i=1; i<list.length; i++) {
      let exists = this.stations.find(s=>s.name===list[i]);
      let next = exists?exists:this.createStation(list[i], color);
      this.createConnection(station, next, color, !!exists);
      station = next;
      stationList.push(station);
    }
    return stationList;
  }

  physics (param={}) {
    let attract = 1.0;
    let repulse = 1.0;
    let slippy = 0.8;
    if (Object.hasOwn(param ,'attract')) { attract = param.attract; }
    if (Object.hasOwn(param ,'repulse')) { repulse = param.repulse; }
    if (Object.hasOwn(param ,'slippy')) { slippy = param.slippy; }

    /*
    for (let node of this.stations) {
      for (let other of this.stations) {
	if (node===other) { continue; }
	if (Math.random()>0.1) { continue; }
	let delx = other.x - node.x;
	let dely = other.y - node.y;
	let dist = Math.sqrt(delx*delx+dely*dely);
	let norx = delx/dist;
	let nory = dely/dist;
	node.velx += -norx * (repulse/dist);
	node.vely += -nory * (repulse/dist);
	if (this.connections.every(connection=>
	  !(connection.nodes.includes(node) && connection.nodes.includes(other))
	)) { continue; }
	node.velx += norx * Math.sqrt(dist)*attract;
	node.vely += nory * Math.sqrt(dist)*attract;
      }
      node.x += node.velx;
      node.y += node.vely;
      node.velx *= slippy;
      node.vely *= slippy;
    }*/

    const SAMPLE = 24;
    for (let i=0; i<this.connections.length*2; i++) {
      let connection = this.connections[i%this.connections.length];
      let node = connection.nodes[i>=this.connections.length?0:1];
      let other = connection.nodes[i>=this.connections.length?1:0];
      
      let delx = other.x - node.x;
      let dely = other.y - node.y;
      let dist = Math.sqrt(delx*delx+dely*dely);
      let norx = delx/dist;
      let nory = dely/dist;
      node.velx += norx * Math.sqrt(dist)*attract;
      node.vely += nory * Math.sqrt(dist)*attract;

      for (let poke=0; poke<SAMPLE; poke++) {
	let other = this.stations[Math.floor(Math.random()*this.stations.length)];
	if (other===node) { continue; }

	let delx = other.x - node.x;
	let dely = other.y - node.y;
	let dist = Math.sqrt(delx*delx+dely*dely);
	let norx = delx/Math.max(0.1, dist*dist);
	let nory = dely/Math.max(0.1, dist*dist);
      if (isNaN(norx)||isNaN(dist)) {
	console.log(node);
      }

	node.velx += -norx * (repulse/dist) / SAMPLE;
	node.vely += -nory * (repulse/dist) / SAMPLE;
      }
    }
    for (let node of this.stations) {
      node.velx *= slippy;
      node.vely *= slippy;
      node.x += node.velx;
      node.y += node.vely;
    }
  }

  render (globTrans=Trans.identity, globInvert=Trans.identity) {
    for (let c of this.connections) {
      let shape = this.shapeMaker.capsule({a: c.nodes[0].toVec4(), b: c.nodes[1].toVec4(), radius: 0.005});
      if (!this.shapes.hasOwnProperty('capsule')) {
	this.shapes['capsule'] = this.ciosaigl.initShape(shape);
      }
      else {
	this.ciosaigl.modifyShape(this.shapes['capsule'], shape);
      }

      this.ciosaigl.xform(Trans.multAll([
        Trans.scale(9/16,1,1),
	globTrans,
        Trans.scale(1, 1, 1),
      ]));
      this.ciosaigl.color(c.color);
      this.ciosaigl.drawShape(this.shapes['capsule']);
    }

    if (!this.shapes.hasOwnProperty('circle')) {
      this.shapes['circle'] = this.ciosaigl.initShape(this.shapeMaker.circle());
    }
    let sz = 0.01;
    for (let s of this.stations) {
      if (s.colors.length>1) {
	this.ciosaigl.xform(Trans.multAll([
	  Trans.scale(9/16,1,1),
	  globTrans,
	  Trans.xlate(s.x, s.y, 0),
	  globInvert,
	  Trans.scale(sz*1.5, sz*1.5, sz*1.5),
	]));
	this.ciosaigl.color([0, 0, 0, 1]);
	this.ciosaigl.drawShape(this.shapes['circle']);

	this.ciosaigl.xform(Trans.multAll([
	  Trans.scale(9/16,1,1),
	  globTrans,
	  Trans.xlate(s.x, s.y, 0),
	  globInvert,
	  Trans.scale(sz, sz, sz),
	]));
	this.ciosaigl.color([1, 1, 1, 1]);
	this.ciosaigl.drawShape(this.shapes['circle']);
      }
      else {
	this.ciosaigl.xform(Trans.multAll([
	  Trans.scale(9/16,1,1),
	  globTrans,
	  Trans.xlate(s.x, s.y, 0),
	  globInvert,
	  Trans.scale(sz, sz, sz),
	]));
	this.ciosaigl.color([0, 0, 0, 1]);
	this.ciosaigl.drawShape(this.shapes['circle']);
      }
    }
    for (let t of this.trains) {
      let x = t.fromSta.x*(1.0-t.perc) + t.toSta.x*t.perc;
      let y = t.fromSta.y*(1.0-t.perc) + t.toSta.y*t.perc;
      let sz = Train.ORIGINAL_SZ*t.sz;
      t.sz = 1+Math.max(0., t.sz-1)*Train.BOP_FALLOFF;
      this.ciosaigl.xform(Trans.multAll([
	Trans.scale(9/16,1,1),
	globTrans,
	Trans.xlate(x, y, 0),
	globInvert,
	Trans.scale(sz, sz, sz),
      ]));
      this.ciosaigl.color(t.line);
      this.ciosaigl.drawShape(this.shapes['circle']);
    }
  }
}
