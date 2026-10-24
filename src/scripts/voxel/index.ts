// Lazy entry for the voxel engine. Only this folder imports three.js.
import { VoxelEngine } from './engine';
import type { Tier } from './formations';

export function createEngine(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, opts: { tier: Tier; dpr: number }) {
  return VoxelEngine.create(canvas, gl, opts);
}
