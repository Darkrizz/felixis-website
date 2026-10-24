// The voxel engine: one instanced mesh of cubes that travels the site, re-forming at each
// station of the current page's stage script. Reads shared signals, writes uniforms,
// renders on the shared ticker.

import {
  BoxGeometry,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix3,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  DynamicDrawUsage,
  WebGLRenderer,
  NoToneMapping,
} from 'three';
import { gsap } from 'gsap';
import { vertex, fragment } from './shaders';
import { clover3d, flatClover, lattice, dust, wordmark, strategyGlyph, growthGlyph, textGlyph, prng, PAL, TIER, type Formation, type Tier } from './formations';
import { stage, type Station, type EngineHandle } from '../core/stage';
import { pointer, scroll } from '../core/signals';
import { onFrame } from '../core/ticker';
import { theme as currentTheme } from '../core/prefs';

const FOV = 30;

const PALETTES = {
  dark: { leaf: '#4CB27A', gold: '#E8B422', centre: '#EEF1EA', dim: '#2E4438', dust: '#2A3F33', leafSoft: '#3F8F63', off: '#20342A', rim: '#F3E3B0' },
  light: { leaf: '#1F6B45', gold: '#E8B422', centre: '#13201A', dim: '#C3CEC0', dust: '#CDD7CA', leafSoft: '#3C8A5E', off: '#D4DCD0', rim: '#FFFFFF' },
};

interface Resolved {
  f: Formation;
  cx: number;
  cy: number;
  s: number;
  visible: boolean;
}

const yieldTask = () => new Promise<void>((r) => setTimeout(r, 0));

export class VoxelEngine implements EngineHandle {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(FOV, 1, 1, 10000);
  private geometry = new InstancedBufferGeometry();
  private material: ShaderMaterial;
  private mesh: Mesh;
  private formations = new Map<string, Formation>();
  private attrs = new Map<string, { pos: InstancedBufferAttribute; meta: InstancedBufferAttribute }>();
  private offsets: Float32Array;
  private vel: Float32Array;
  private offsetAttr: InstancedBufferAttribute;
  private n: number;
  private w = 0;
  private h = 0;
  private dpr: number;
  private unsub: (() => void)[] = [];
  private anchorEls = new Map<string, HTMLElement | null>();
  private stageVersion = -1;
  private fromName = '';
  private toName = '';
  private tilt = { yaw: 0, pitch: 0, mix: 0 };
  private springsAwake = false;
  private frozen: { f: Formation; cx: number; cy: number; s: number; r: Matrix3; z: number } | null = null;
  private entry: { p: number; tween: gsap.core.Tween } | null = null;
  private lastFrom: Resolved | null = null;
  private lastTo: Resolved | null = null;
  private lastP = 0;
  private rendering = true;
  private wire = false;
  /** voxel sandbox state */
  private sb = { gravity: false, brush: null as Color | null };
  private tint: Float32Array;
  private tintAttr: InstancedBufferAttribute;
  private piles = new Map<string, Float32Array>();
  readonly tier: Tier;

  private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, tier: Tier, dpr: number) {
    this.tier = tier;
    this.dpr = dpr;
    this.n = TIER[tier].n;
    this.renderer = new WebGLRenderer({ canvas, context: gl, alpha: true, antialias: dpr < 2 });
    this.renderer.setPixelRatio(dpr);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.setClearColor(0x000000, 0);

    const box = new BoxGeometry(1, 1, 1);
    this.geometry.index = box.index;
    this.geometry.setAttribute('position', box.getAttribute('position'));
    this.geometry.setAttribute('normal', box.getAttribute('normal'));
    this.geometry.instanceCount = this.n;

    const rnd = prng(101);
    const seed = new Float32Array(this.n * 4);
    for (let i = 0; i < seed.length; i++) seed[i] = rnd();
    this.geometry.setAttribute('aSeed', new InstancedBufferAttribute(seed, 4));
    this.offsets = new Float32Array(this.n * 3);
    this.vel = new Float32Array(this.n * 3);
    this.offsetAttr = new InstancedBufferAttribute(this.offsets, 3);
    this.offsetAttr.setUsage(DynamicDrawUsage);
    this.geometry.setAttribute('aOffset', this.offsetAttr);
    this.tint = new Float32Array(this.n * 4);
    this.tintAttr = new InstancedBufferAttribute(this.tint, 4);
    this.tintAttr.setUsage(DynamicDrawUsage);
    this.geometry.setAttribute('aTint', this.tintAttr);

    this.material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uFromC: { value: [0, 0, 0] },
        uToC: { value: [0, 0, 0] },
        uFromS: { value: 1 },
        uToS: { value: 1 },
        uFromR: { value: new Matrix3() },
        uToR: { value: new Matrix3() },
        uFromZ: { value: 1 },
        uToZ: { value: 1 },
        uProgress: { value: 0 },
        uStagger: { value: 0.6 },
        uArc: { value: 7 },
        uLift: { value: 14 },
        uSpin: { value: 2.4 },
        uExplode: { value: 0 },
        uExplodeR: { value: 0 },
        uVel: { value: 0 },
        uGap: { value: 0 },
        uPalette: { value: Array.from({ length: 8 }, () => new Color()) },
        uLit: { value: 99 },
        uLitFrom: { value: 0 },
        uLitTo: { value: 0 },
        uGold: { value: 0 },
        uOff: { value: new Color() },
        uRim: { value: new Color() },
        uFlat: { value: 1 },
        uWire: { value: 0 },
        uFade: { value: 1 },
      },
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    this.setTheme(currentTheme());
  }

  static async create(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, opts: { tier: Tier; dpr: number }) {
    const e = new VoxelEngine(canvas, gl, opts.tier, opts.dpr);
    await e.build();
    e.resize();
    e.start();
    return e;
  }

  private async build() {
    const t = this.tier;
    const gens: [string, () => Formation | Promise<Formation>][] = [
      ['clover3d', () => clover3d(t)],
      ['lattice', () => lattice(t)],
      ['flatclover', () => flatClover(t)],
      ['dust', () => dust(t)],
      ['strategy', () => strategyGlyph(t)],
      ['growth', () => growthGlyph(t)],
      [
        'wordmark',
        async () => {
          const family = getComputedStyle(document.body).fontFamily;
          await document.fonts.load(`700 100px ${family}`);
          return wordmark(t, family);
        },
      ],
      ['design', () => textGlyph('design', t, getComputedStyle(document.body).fontFamily, 'Aa', (ch) => (ch === 'A' ? PAL.gold : PAL.leaf))],
      ['development', () => textGlyph('development', t, getComputedStyle(document.body).fontFamily, '</>', (ch) => (ch === '/' ? PAL.gold : PAL.leaf))],
    ];
    for (const [name, gen] of gens) {
      const f = await gen();
      this.formations.set(name, f);
      this.attrs.set(name, { pos: new InstancedBufferAttribute(f.pos, 4), meta: new InstancedBufferAttribute(f.meta, 4) });
      await yieldTask();
    }
    this.bind('aFrom', 'clover3d');
    this.bind('aTo', 'clover3d');
    await this.renderer.compileAsync(this.scene, this.camera);
  }

  /** Point a morph slot at a formation's buffers (no re-upload, no recompile). */
  private bind(slot: 'aFrom' | 'aTo', name: string) {
    const a = this.attrs.get(name) ?? this.attrs.get('clover3d')!;
    this.geometry.setAttribute(slot, a.pos);
    this.geometry.setAttribute(`${slot}M`, a.meta);
    if (slot === 'aFrom') this.fromName = name;
    else this.toName = name;
  }

  private start() {
    const ro = () => this.resize();
    addEventListener('resize', ro);
    this.unsub.push(() => removeEventListener('resize', ro));
    this.unsub.push(onFrame('sim', (t, dt) => this.simulate(t, dt)));
    this.unsub.push(onFrame('render', () => this.draw()));

    const canvas = this.renderer.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      document.documentElement.classList.remove('gl-on', 'gl-ready');
    };
    const restored = () => {
      document.documentElement.classList.add('gl-on', 'gl-ready');
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    this.unsub.push(() => {
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
    });

    // Handoff from the SVG mark: render flat and gapless first, then let it become 3D.
    const u = this.material.uniforms;
    u.uFlat.value = 1;
    u.uGap.value = 0;
    gsap.to(u.uFlat, { value: 0, duration: 1.2, ease: 'power2.inOut', delay: 0.15 });
    gsap.to(u.uGap, { value: 0.14, duration: 1.2, ease: 'expo.out', delay: 0.15 });
    gsap.to(this.tilt, { mix: 1, duration: 1.8, ease: 'power2.inOut', delay: 0.3 });
  }

  private resize() {
    const c = this.renderer.domElement;
    const w = c.clientWidth || innerWidth;
    const h = c.clientHeight || innerHeight;
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    const d = h / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
    this.camera.aspect = w / h;
    this.camera.position.set(0, 0, d);
    this.camera.near = d * 0.1;
    this.camera.far = d * 4;
    this.camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- stations

  private anchor(name: string) {
    if (!this.anchorEls.has(name)) this.anchorEls.set(name, document.querySelector<HTMLElement>(`[data-voxel-anchor="${name}"]`));
    return this.anchorEls.get(name) ?? null;
  }

  private resolve(st: Station | undefined): Resolved {
    const f = this.formations.get(st?.formation ?? 'clover3d') ?? this.formations.get('clover3d')!;
    let rect: { left: number; top: number; width: number; height: number };
    if (!st || st.anchor === 'viewport') rect = { left: 0, top: 0, width: this.w, height: this.h };
    else {
      const el = this.anchor(st.anchor);
      rect = el ? el.getBoundingClientRect() : { left: this.w * 0.6, top: this.h * 0.2, width: this.h * 0.5, height: this.h * 0.5 };
    }
    const sx = rect.width / f.fit.w;
    const sy = rect.height / f.fit.h;
    const s = f.fit.mode === 'contain' ? Math.min(sx, sy) : Math.max(sx, sy);
    const cx = rect.left + rect.width / 2 - this.w / 2;
    const cy = this.h / 2 - (rect.top + rect.height / 2);
    const margin = this.h * 0.25;
    const visible = rect.top < this.h + margin && rect.top + rect.height > -margin;
    return { f, cx, cy, s, visible };
  }

  private rotationFor(st: Station | undefined, out: Matrix3, time: number) {
    if (!st || (st.pose !== 'tilt' && st.pose !== 'float')) return out.identity();
    const m = this.tilt.mix;
    // tilt shows the mark's depth; float keeps glyphs readable and only sways
    const float = st.pose === 'float';
    const yaw = (float ? (this.tilt.yaw * 0.35 + Math.sin(time * 0.5) * 0.08) * m : (this.tilt.yaw + Math.sin(time * 0.55) * 0.05 - 0.32) * m) + stage.spin.yaw;
    const pitch = (float ? (this.tilt.pitch * 0.3 + Math.cos(time * 0.41) * 0.05) * m : (this.tilt.pitch + Math.cos(time * 0.43) * 0.035 + 0.2) * m) + stage.spin.pitch;
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw),
      cx = Math.cos(pitch),
      sx = Math.sin(pitch);
    // R = Ry(yaw) * Rx(pitch), column-major via set() row order
    return out.set(cy, sy * sx, sy * cx, 0, cx, -sx, -sy, cy * sx, cy * cx);
  }

  // ---------------------------------------------------------------- per frame

  private simulate(time: number, dt: number) {
    if (stage.version !== this.stageVersion) this.onStage();
    const u = this.material.uniforms;
    const stations = stage.stations.length ? stage.stations : [{ formation: 'clover3d', anchor: 'hero', pose: 'tilt' } as Station];

    // which morph are we in?
    let from = 0;
    let to = 0;
    let p = 0;
    if (stage.morphs.length) {
      from = to = stage.morphs[0].from;
      for (const m of stage.morphs) {
        if (m.st.start === undefined) continue;
        if (m.st.scroll() >= m.st.start) {
          from = m.from;
          to = m.to;
          p = m.st.progress;
        }
      }
    }

    // pointer-driven tilt, smoothed
    const ty = pointer.active ? (pointer.x / this.w - 0.5) * 0.7 : 0;
    const tp = pointer.active ? (pointer.y / this.h - 0.5) * 0.45 : 0;
    this.tilt.yaw += (ty - this.tilt.yaw) * Math.min(1, dt * 3);
    this.tilt.pitch += (tp - this.tilt.pitch) * Math.min(1, dt * 3);

    let A: Resolved;
    let B: Resolved;
    const rA = u.uFromR.value as Matrix3;
    const rB = u.uToR.value as Matrix3;
    let sA: Station | undefined = stations[from];
    const sB: Station | undefined = stations[to];

    if (this.entry && this.frozen) {
      // page change: carry the old shape from where it was to the new page's first station
      A = { f: this.frozen.f, cx: this.frozen.cx, cy: this.frozen.cy, s: this.frozen.s, visible: true };
      rA.copy(this.frozen.r);
      B = this.resolve(stations[0]);
      this.rotationFor(stations[0], rB, time);
      p = this.entry.p;
      sA = undefined;
      if (this.fromName !== A.f.name) this.bind('aFrom', A.f.name);
      if (this.toName !== B.f.name) this.bind('aTo', B.f.name);
      u.uFromZ.value = this.frozen.z;
      u.uLitFrom.value = 0;
      u.uLitTo.value = stations[0]?.lit ? 1 : 0;
    } else {
      A = this.resolve(sA);
      B = from === to ? A : this.resolve(sB);
      this.rotationFor(sA, rA, time);
      if (from === to) rB.copy(rA);
      else this.rotationFor(sB, rB, time);
      if (this.fromName !== A.f.name) this.bind('aFrom', A.f.name);
      if (this.toName !== B.f.name) this.bind('aTo', B.f.name);
      u.uFromZ.value = A.f.z;
      u.uLitFrom.value = sA?.lit ? 1 : 0;
      u.uLitTo.value = sB?.lit ? 1 : 0;
    }
    u.uToZ.value = B.f.z;
    (u.uFromC.value as number[]).splice(0, 3, A.cx, A.cy, 0);
    (u.uToC.value as number[]).splice(0, 3, B.cx, B.cy, 0);
    u.uFromS.value = A.s;
    u.uToS.value = B.s;
    u.uProgress.value = p;
    u.uVel.value = scroll.v;
    u.uLit.value = stage.lit;
    u.uGold.value = stage.gold;
    u.uExplodeR.value = 26 * (p < 0.5 ? A.s : B.s);
    this.lastFrom = A;
    this.lastTo = B;
    this.lastP = p;

    // pointer springs on stations that allow scattering, only while at rest
    const rest = p < 0.02 ? sA : p > 0.98 ? sB : undefined;
    const restRes = p < 0.02 ? A : B;
    this.springs(rest?.scatter ? restRes : null, p < 0.02 ? rA : rB, dt);

    this.rendering = (A.visible || B.visible || this.entry !== null) && u.uFade.value > 0.001;
  }

  private springs(at: Resolved | null, R: Matrix3, dt: number) {
    const off = this.offsets;
    const vel = this.vel;
    const n = this.n;
    const k = Math.min(1, dt * 60);
    let energy = 0;
    const sb = this.sb;
    const painting = Boolean(at && sb.brush && pointer.down && pointer.active);
    const push = at && pointer.active && !pointer.coarse && !sb.brush;
    const gravity = Boolean(at && sb.gravity);
    if (!push && !this.springsAwake && !gravity && !painting) return;
    const e = R.elements;
    const pos = at?.f.pos;
    const s = at?.s ?? 1;
    const radius = 70 + 6 * s;
    const brushR = 4.2 * s;
    const px = pointer.x - this.w / 2;
    const py = this.h / 2 - pointer.y;
    const pvx = pointer.vx;
    const pvy = -pointer.vy;
    const piles = gravity && at ? this.pilesFor(at.f) : null;
    let painted = false;
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      let fx = -off[j] * 0.06;
      let fy = gravity ? 0 : -off[j + 1] * 0.06;
      let fz = -off[j + 2] * 0.06;
      let floor = -Infinity;
      if (pos && at && (push || gravity || painting)) {
        const x = pos[i * 4] * s;
        const y = pos[i * 4 + 1] * s;
        const z = pos[i * 4 + 2] * s * at.f.z;
        const wx0 = at.cx + e[0] * x + e[3] * y + e[6] * z;
        const wy0 = at.cy + e[1] * x + e[4] * y + e[7] * z;
        const dx = wx0 + off[j] - px;
        const dy = wy0 + off[j + 1] - py;
        const d = Math.hypot(dx, dy);
        if (push && d < radius) {
          const f = (1 - d / radius) ** 2;
          const inv = 1 / (d + 0.001);
          fx += dx * inv * f * 3.4 + pvx * f * 0.3;
          fy += dy * inv * f * 3.4 + pvy * f * 0.3;
          fz += f * 3;
        }
        if (painting && d < brushR) {
          const t = i * 4;
          this.tint[t] = sb.brush!.r;
          this.tint[t + 1] = sb.brush!.g;
          this.tint[t + 2] = sb.brush!.b;
          this.tint[t + 3] = 1;
          painted = true;
        }
        if (piles) {
          // fall until the cube rests on the ones below it in its column
          floor = at.cy + piles[i] * s - wy0;
          fy -= 1.4;
        }
      }
      vel[j] = (vel[j] + fx * k) * 0.84;
      vel[j + 1] = (vel[j + 1] + fy * k) * (gravity ? 0.985 : 0.84);
      vel[j + 2] = (vel[j + 2] + fz * k) * 0.84;
      off[j] += vel[j] * k;
      off[j + 1] += vel[j + 1] * k;
      off[j + 2] += vel[j + 2] * k;
      if (off[j + 1] < floor) {
        off[j + 1] = floor;
        vel[j + 1] *= -0.28;
      }
      energy += Math.abs(off[j]) + Math.abs(off[j + 1]) + Math.abs(off[j + 2]);
    }
    if (painted) this.tintAttr.needsUpdate = true;
    this.springsAwake = energy > 0.5 * n * 0.01 || Boolean(push) || gravity;
    if (!this.springsAwake) {
      off.fill(0);
      vel.fill(0);
    }
    this.offsetAttr.needsUpdate = true;
  }

  private draw() {
    const canvas = this.renderer.domElement;
    const vis = this.rendering ? 'visible' : 'hidden';
    if (canvas.style.visibility !== vis) canvas.style.visibility = vis;
    if (!this.rendering) return;
    this.renderer.render(this.scene, this.camera);
  }

  /** Resting height (units) for each cube when gravity is on: stacked inside its own column. */
  private pilesFor(f: Formation) {
    const cached = this.piles.get(f.name);
    if (cached) return cached;
    const n = this.n;
    const out = new Float32Array(n);
    let minY = Infinity;
    for (let i = 0; i < n; i++) minY = Math.min(minY, f.pos[i * 4 + 1] - f.meta[i * 4 + 1] / 2);
    const cols = new Map<string, number[]>();
    for (let i = 0; i < n; i++) {
      const size = f.meta[i * 4 + 1] || 1;
      const key = `${Math.round(f.pos[i * 4] / size)}:${Math.round(f.pos[i * 4 + 2] / size)}`;
      if (!cols.has(key)) cols.set(key, []);
      cols.get(key)!.push(i);
    }
    for (const list of cols.values()) {
      list.sort((a, b) => f.pos[a * 4 + 1] - f.pos[b * 4 + 1]);
      let h = minY;
      let lastY = -Infinity;
      for (const i of list) {
        const size = f.meta[i * 4 + 1] || 1;
        // duplicates (resampled points) share a slot instead of stacking
        if (Math.abs(f.pos[i * 4 + 1] - lastY) > 1e-3) h += size;
        lastY = f.pos[i * 4 + 1];
        out[i] = h - size / 2;
      }
    }
    this.piles.set(f.name, out);
    return out;
  }

  sandbox(cmd: 'gravity' | 'explode' | 'reset' | 'brush', arg?: string | null) {
    if (cmd === 'gravity') {
      this.sb.gravity = !this.sb.gravity;
      this.springsAwake = true;
      return this.sb.gravity;
    }
    if (cmd === 'explode') {
      this.explode();
      return true;
    }
    if (cmd === 'brush') {
      this.sb.brush = arg ? new Color(arg) : null;
      return Boolean(arg);
    }
    // reset
    this.sb.gravity = false;
    this.sb.brush = null;
    this.tint.fill(0);
    this.tintAttr.needsUpdate = true;
    this.springsAwake = true;
    stage.spin.yaw = 0;
    stage.spin.pitch = 0;
    return true;
  }

  private onStage() {
    this.stageVersion = stage.version;
    this.anchorEls.clear();
    if (this.sb.gravity || this.sb.brush || this.tint.some((v) => v !== 0)) this.sandbox('reset');
    if (this.frozen) {
      this.entry?.tween.kill();
      const entry = { p: 0, tween: null as unknown as gsap.core.Tween };
      entry.tween = gsap.to(entry, {
        p: 1,
        duration: 1.5,
        ease: 'power2.inOut',
        onComplete: () => {
          this.entry = null;
          this.frozen = null;
        },
      });
      this.entry = entry;
    }
  }

  // ---------------------------------------------------------------- handle

  explode() {
    const u = this.material.uniforms.uExplode;
    gsap.killTweensOf(u);
    gsap
      .timeline()
      .to(u, { value: 1, duration: 0.55, ease: 'expo.out' })
      .to(u, { value: 0, duration: 1.4, ease: 'elastic.out(1, 0.55)' }, '+=0.15');
  }

  setTheme(t: 'dark' | 'light') {
    const pal = PALETTES[t];
    const arr = this.material.uniforms.uPalette.value as Color[];
    [pal.leaf, pal.gold, pal.centre, pal.dim, pal.dust, pal.leafSoft, pal.leaf, pal.leaf].forEach((hex, i) => arr[i].set(hex));
    (this.material.uniforms.uOff.value as Color).set(pal.off);
    (this.material.uniforms.uRim.value as Color).set(pal.rim);
  }

  setWire(on: boolean) {
    this.wire = on;
    this.material.uniforms.uWire.value = on ? 1 : 0;
  }

  /** Called just before a page swap: remember what's on screen so the next page can morph from it. */
  freezeForSwap() {
    const A = this.lastFrom;
    const B = this.lastTo;
    if (!A || !B) return;
    const u = this.material.uniforms;
    const useB = this.lastP >= 0.5;
    const src = useB ? B : A;
    this.frozen = {
      f: src.f,
      cx: src.cx,
      cy: src.cy,
      s: src.s,
      r: (useB ? (u.uToR.value as Matrix3) : (u.uFromR.value as Matrix3)).clone(),
      z: src.f.z,
    };
  }

  stats() {
    const info = this.renderer.info.render;
    return {
      instances: this.n,
      calls: info.calls,
      triangles: info.triangles,
      tier: this.tier,
      dpr: this.dpr,
      rendering: this.rendering,
      wire: this.wire,
      formation: this.lastP < 0.5 ? this.fromName : this.toName,
    };
  }

  dispose() {
    this.unsub.forEach((fn) => fn());
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    this.renderer.domElement.style.visibility = 'hidden';
  }
}
