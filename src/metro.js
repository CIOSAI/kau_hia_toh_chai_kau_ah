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

  physics (param={}) {
    let attract = 1.0;
    let repulse = 1.0;
    let slippy = 0.8;
    if (param.hasOwnProperty('attract')) { attract = param.attract; }
    if (param.hasOwnProperty('repulse')) { repulse = param.repulse; }
    if (param.hasOwnProperty('slippy')) { slippy = param.slippy; }

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
      this.ciosaigl.xform(Trans.multAll([
        Trans.scale(9/16,1,1),
        Trans.scale(1, 1, 1),
      ]));
      this.ciosaigl.color(c.color);
      this.ciosaigl.drawBasic(shape);
    }
    let sz = 0.05;
    for (let s of this.stations) {
      let shape = this.shapeMaker.circle();
      this.ciosaigl.xform(Trans.multAll([
        Trans.scale(9/16,1,1),
	Trans.xlate(s.x, s.y, 0),
        Trans.scale(sz, sz, sz),
      ]));
      this.ciosaigl.color(s.colors[0]); //TODO: render transfer stations
      this.ciosaigl.drawBasic(shape);
    }
  }
}
