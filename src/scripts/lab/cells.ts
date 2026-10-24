// Cell shader in raw WebGL2 (no three.js): a ping-pong trail buffer that the pointer paints
// into, and a display pass that quantises a noise field plus the trail into brand-coloured
// cells. Halftone mode sizes each square by its value.

import { onFrame } from '../core/ticker';
import { reducedMotion } from '../core/prefs';

const VERT = `#version 300 es
in vec2 p;
out vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const TRAIL = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 o;
uniform sampler2D prev;
uniform vec2 mouse;
uniform float radius;
uniform float strength;
uniform float aspect;
void main() {
  float v = texture(prev, uv).r * 0.965;
  vec2 d = (uv - mouse) * vec2(aspect, 1.0);
  v += strength * smoothstep(radius, 0.0, length(d));
  o = vec4(min(v, 1.5), 0.0, 0.0, 1.0);
}`;

const DISPLAY = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 o;
uniform sampler2D trail;
uniform vec2 res;
uniform float cell;
uniform float time;
uniform float mode;
uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3; uniform vec3 c4;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

void main() {
  vec2 px = uv * res;
  vec2 id = floor(px / cell);
  vec2 cuv = (id + 0.5) * cell / res;
  vec2 local = fract(px / cell) - 0.5;
  float n = fbm(cuv * vec2(res.x / res.y, 1.0) * 2.4 + vec2(time * 0.07, -time * 0.05));
  n = smoothstep(0.32, 0.78, n);
  float t = texture(trail, cuv).r;
  float v = clamp(n * 0.62 + t * 0.9, 0.0, 1.0);
  vec3 col = v < 0.2 ? c0 : v < 0.4 ? c1 : v < 0.62 ? c2 : v < 0.84 ? c3 : c4;
  float size = mode < 0.5 ? mix(0.12, 0.92, v) : 0.88;
  float inside = step(max(abs(local.x), abs(local.y)), size * 0.5);
  o = vec4(mix(c0, col, inside), 1.0);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
    gl.attachShader(prog, sh);
  }
  gl.bindAttribLocation(prog, 0, 'p');
  gl.linkProgram(prog);
  return prog;
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export default function cells(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-cs-canvas]')!;
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) {
    root.querySelector<HTMLElement>('[data-cs-fallback]')!.hidden = false;
    return;
  }
  const trailProg = compile(gl, VERT, TRAIL);
  const showProg = compile(gl, VERT, DISPLAY);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const TW = 256;
  const TH = 144;
  const targets = [0, 1].map(() => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TW, TH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb };
  });
  let read = 0;

  const loc = (prog: WebGLProgram, n: string) => gl.getUniformLocation(prog, n);
  const sizeIn = root.querySelector<HTMLInputElement>('[data-cs-size]')!;
  const speedIn = root.querySelector<HTMLInputElement>('[data-cs-speed]')!;
  const mouse = { x: 0.5, y: 0.5, on: 0, down: false };
  let time = 0;
  let visible = false;

  const pm = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width;
    mouse.y = 1 - (e.clientY - r.top) / r.height;
    mouse.on = 1;
  };
  canvas.addEventListener('pointermove', pm);
  canvas.addEventListener('pointerdown', (e) => {
    mouse.down = true;
    pm(e);
  });
  addEventListener('pointerup', () => (mouse.down = false));
  canvas.addEventListener('pointerleave', () => (mouse.on = 0));

  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);

  const frame = (_t: number, dt: number) => {
    if (!visible) return;
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(r.width * dpr);
    const H = Math.round(r.height * dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    const theme = document.documentElement.dataset.theme === 'light';
    if (!reducedMotion()) time += dt * Number(speedIn.value);
    root.querySelector('[data-cs-size-out]')!.textContent = sizeIn.value;
    root.querySelector('[data-cs-speed-out]')!.textContent = Number(speedIn.value).toFixed(1);

    // trail pass
    gl.useProgram(trailProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, targets[1 - read].fb);
    gl.viewport(0, 0, TW, TH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets[read].tex);
    gl.uniform1i(loc(trailProg, 'prev'), 0);
    gl.uniform2f(loc(trailProg, 'mouse'), mouse.x, mouse.y);
    gl.uniform1f(loc(trailProg, 'radius'), mouse.down ? 0.16 : 0.09);
    gl.uniform1f(loc(trailProg, 'strength'), mouse.on * (mouse.down ? 0.5 : 0.18));
    gl.uniform1f(loc(trailProg, 'aspect'), W / H);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    read = 1 - read;

    // display pass
    gl.useProgram(showProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.bindTexture(gl.TEXTURE_2D, targets[read].tex);
    gl.uniform1i(loc(showProg, 'trail'), 0);
    gl.uniform2f(loc(showProg, 'res'), W, H);
    gl.uniform1f(loc(showProg, 'cell'), Number(sizeIn.value) * dpr);
    gl.uniform1f(loc(showProg, 'time'), time);
    gl.uniform1f(loc(showProg, 'mode'), Number(root.querySelector<HTMLInputElement>('input[name="csm"]:checked')?.value ?? 0));
    const pal = theme ? ['#EEF1EA', '#C9D3C5', '#1F6B45', '#E8B422', '#13201A'] : ['#13201A', '#24392D', '#4CB27A', '#E8B422', '#EEF1EA'];
    ['c0', 'c1', 'c2', 'c3', 'c4'].forEach((n, i) => gl.uniform3fv(loc(showProg, n), rgb(pal[i])));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const off = onFrame('render', frame);
  return () => {
    off();
    io.disconnect();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
