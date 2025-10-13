import { CiosaiGL, Trans, Shapes } from "/lib/ciosaigl/index.js";

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

export class Metro {
  constructor (ciosaigl) {
    this.ciosaigl = ciosaigl;
    this.shapeMaker = new Shapes(16);
    this.stations = [];
    this.connections = [];
    this.trains = [];
    this.shapes = {};
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

  createTrain (color, startingStation) {
    let train = {line: color, fromSta: startingStation, toSta: startingStation, forward: true, perc: 0.0};
    this.trains.push(train);
    this.setTrainRoute(train);
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

  runTrain (speed) {
    for (let train of this.trains) {
      train.perc += speed;
      if (train.perc<0) { train.perc = 0; }
      if (train.perc>1) {
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
    let station = this.createStation(list[0], color);
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

    for (let node of this.stations) {
      for (let other of this.stations) {
	if (node===other) { continue; }
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
      this.ciosaigl.xform(Trans.multAll([
	Trans.scale(9/16,1,1),
	globTrans,
	Trans.xlate(x, y, 0),
	globInvert,
	Trans.scale(sz*2, sz*2, sz*2),
      ]));
      this.ciosaigl.color(t.line);
      this.ciosaigl.drawShape(this.shapes['circle']);
    }
  }
}
