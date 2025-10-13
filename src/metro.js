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
    this.shapeMaker = new Shapes(32);
    this.stations = [];
    this.connections = [];
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

  entireLine (color, list) {
    let station = this.createStation(list[0], color);
    for (let i=1; i<list.length; i++) {
      let exists = this.stations.find(s=>s.name===list[i]);
      let next = exists?exists:this.createStation(list[i], color);
      this.createConnection(station, next, color, !!exists);
      station = next;
    }
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
	if (this.connections.every(connection=>
	  !connection.nodes.includes(node) && !connection.nodes.includes(other)
	)) { continue; }
	let delx = other.x - node.x;
	let dely = other.y - node.y;
	let dist = Math.sqrt(delx*delx+dely*dely);
	let norx = delx/dist;
	let nory = dely/dist;
	node.velx += -norx * (repulse/dist);
	node.vely += -nory * (repulse/dist);
	node.velx += norx * Math.sqrt(dist)*attract;
	node.vely += nory * Math.sqrt(dist)*attract;
      }
      node.x += node.velx;
      node.y += node.vely;
      node.velx *= slippy;
      node.vely *= slippy;
    }
  }

  render () {
    for (let c of this.connections) {
      let shape = this.shapeMaker.capsule({a: c.nodes[0].toVec4(), b: c.nodes[1].toVec4(), radius: 0.02});
      if (!this.shapes.hasOwnProperty('capsule')) {
	this.shapes['capsule'] = this.ciosaigl.initShape(shape);
      }
      else {
	this.ciosaigl.modifyShape(this.shapes['capsule'], shape);
      }

      this.ciosaigl.xform(Trans.multAll([
        Trans.scale(9/16,1,1),
        Trans.scale(1, 1, 1),
      ]));
      this.ciosaigl.color(c.color);
      this.ciosaigl.drawShape(this.shapes['capsule']);
    }

    if (!this.shapes.hasOwnProperty('circle')) {
      this.shapes['circle'] = this.ciosaigl.initShape(this.shapeMaker.circle());
    }
    let sz = 0.05;
    for (let s of this.stations) {
      if (s.colors.length>1) {
	this.ciosaigl.xform(Trans.multAll([
	  Trans.scale(9/16,1,1),
	  Trans.xlate(s.x, s.y, 0),
	  Trans.scale(sz*1.5, sz*1.5, sz*1.5),
	]));
	this.ciosaigl.color([0, 0, 0, 1]);
	this.ciosaigl.drawShape(this.shapes['circle']);

	this.ciosaigl.xform(Trans.multAll([
	  Trans.scale(9/16,1,1),
	  Trans.xlate(s.x, s.y, 0),
	  Trans.scale(sz, sz, sz),
	]));
	this.ciosaigl.color([1, 1, 1, 1]);
	this.ciosaigl.drawShape(this.shapes['circle']);
      }
      else {
	this.ciosaigl.xform(Trans.multAll([
	  Trans.scale(9/16,1,1),
	  Trans.xlate(s.x, s.y, 0),
	  Trans.scale(sz, sz, sz),
	]));
	this.ciosaigl.color([0, 0, 0, 1]);
	this.ciosaigl.drawShape(this.shapes['circle']);
      }
    }

  }
}
