// Boots the voxel engine after the page has loaded and gone idle. main.ts owns the WebGL2
// context: if it can't get one (or motion is off, or Save-Data is on) three.js is never
// downloaded and the SVG marks simply stay.

import { reducedMotion, saveData, onMotionChange, testMode } from './prefs';
import { engineRef } from './stage';

const root = document.documentElement;
let booting = false;
let failed = false;

const idle = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1800 }) : setTimeout(fn, 300);

function softwareRenderer(gl: WebGL2RenderingContext) {
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  return /swiftshader|llvmpipe|basic render|software/i.test(name);
}

function tier(): 'desktop' | 'mobile' | 'low' {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (cores <= 4 && mem <= 4) return 'low';
  if (coarse || innerWidth < 900) return 'mobile';
  return 'desktop';
}

async function start() {
  if (booting || failed || engineRef.current || reducedMotion() || saveData()) return;
  // never swap the SVG for voxels underneath the first-visit preloader
  if (root.classList.contains('preload') || root.classList.contains('preload-page')) {
    setTimeout(start, 120);
    return;
  }
  const canvas = document.getElementById('fx-gl') as HTMLCanvasElement | null;
  if (!canvas) return;
  booting = true;
  const t = tier();
  const dpr = Math.min(devicePixelRatio || 1, t === 'desktop' ? 2 : t === 'mobile' ? 1.5 : 1);
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: dpr < 2,
    premultipliedAlpha: true,
    powerPreference: 'default',
    failIfMajorPerformanceCaveat: !testMode,
    preserveDrawingBuffer: testMode,
  });
  if (!gl || (softwareRenderer(gl) && !testMode)) {
    failed = true;
    booting = false;
    root.classList.add('gl-off');
    return;
  }
  try {
    const { createEngine } = await import('../voxel/index');
    engineRef.current = await createEngine(canvas, gl, { tier: t, dpr });
    root.classList.add('gl-on');
    // the SVG marks fade only after the first frame is on screen
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('gl-ready')));
  } catch (err) {
    failed = true;
    root.classList.add('gl-off');
    console.warn('[felixis] WebGL engine unavailable, using SVG marks.', err);
  } finally {
    booting = false;
  }
}

export function bootGL() {
  const go = () => idle(start);
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });

  onMotionChange((reduced) => {
    if (reduced && engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
      root.classList.remove('gl-on', 'gl-ready');
    } else if (!reduced) go();
  });
}
