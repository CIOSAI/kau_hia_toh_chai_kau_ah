const AudioContext = window.AudioContext || window.webkitAudioContext;

const centralA = 440.0;

export class Beeper {
  constructor (ciosaigl) {
    this.ciosaigl = ciosaigl;
    this.ctx = new AudioContext();

    this.bufferDuration = 0.5; // in seconds
    this.buffer = new AudioBuffer(
      {numberOfChannels: 2, length: this.bufferDuration*this.ctx.sampleRate, sampleRate: this.ctx.sampleRate}
    );
    this.fb = this.ciosaigl.initFb({width: this.bufferDuration*this.ctx.sampleRate/4, height: 2, 
                                    format: this.ciosaigl.gl.RGBA32F});
    this.quadShaderV = `
      void main() {
	int i = gl_VertexID;
	vec2 p = i==0?vec2(-1,-1):i==1?vec2(2,-1):vec2(-1,2);
	gl_Position = vec4(p,0,1);
      }`;
    this.shaderFPrefix = `
      uniform float sampleRate;
      uniform float pitch;
      uniform float volume;
    `;
    this.shaderFSuffix = `
      void main() {
	vec4 c;
	if (gl_FragCoord.y<0.5) {
	  c.x = song(gl_FragCoord.x*4./sampleRate).x;
	  c.y = song((gl_FragCoord.x*4.+1.)/sampleRate).x;
	  c.z = song((gl_FragCoord.x*4.+2.)/sampleRate).x;
	  c.w = song((gl_FragCoord.x*4.+3.)/sampleRate).x;
	}
	else {
	  c.x = song(gl_FragCoord.x*4./sampleRate).y;
	  c.y = song((gl_FragCoord.x*4.+1.)/sampleRate).y;
	  c.z = song((gl_FragCoord.x*4.+2.)/sampleRate).y;
	  c.w = song((gl_FragCoord.x*4.+3.)/sampleRate).y;
	}
	FragColor = c;
      }`;
    this.synths = {};
  }

  initSynth (name, fragment) {
    this.synths[name] = {
      name: name,
      shader: this.ciosaigl.initShader(`${this.shaderFPrefix}${fragment}${this.shaderFSuffix}`, this.quadShaderV),
    };
    return this.synths[name];
  }

  static pitch (note) {
    if (!/[ABCDEFG][b\#]?[0-9]+/.test(note)) {
      console.warn(`what format is ${note}? expected something like A#4, G6, Db2...`);
    }
    let name = note.match(/([ABCDEFG])([b\#]?)/);
    let octave = parseInt(note.match(/[ABCDEFG][b\#]?([0-9]+)/)[1]);
    let n = (
      {A:0, B:2, C:3, D:5, E:7, F:8, G:10}[name[1]] + (name[2]?(name[2]==='b'?-1:1):0)
    ) + (
      (octave-(['A', 'B'].includes(name[1])?4:5)) * 12
    );
    return centralA*Math.pow(2.0, n/12.0); 
  }

  static tet (division, n) {
    return centralA*Math.pow(2.0, n/division);
  }

  play (synth, params=[]) {
    if (this.ctx.state==='running') {
      this.ciosaigl.setUniform(synth.shader, [{type: 'float', key: 'sampleRate', value: this.ctx.sampleRate}, ...params]);

      this.ciosaigl.useFb(this.fb);
      this.ciosaigl.drawShape({loc: 0, tri: 3}, synth.shader);

      this.ciosaigl.gl.readPixels(0,0,this.bufferDuration*this.ctx.sampleRate/4,1,
				  this.ciosaigl.gl.RGBA,this.ciosaigl.gl.FLOAT,this.buffer.getChannelData(0));
      this.ciosaigl.gl.readPixels(0,1,this.bufferDuration*this.ctx.sampleRate/4,1,
				  this.ciosaigl.gl.RGBA,this.ciosaigl.gl.FLOAT,this.buffer.getChannelData(1));

      this.ciosaigl.useFb();
    }

    let soundClip = new AudioBufferSourceNode(this.ctx, {buffer: this.buffer});

    soundClip.connect(this.ctx.destination);
    soundClip.start();
  }
}
