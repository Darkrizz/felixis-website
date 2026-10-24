// The voxel "script" for the current page: where the clover stands (stations) and the
// scroll ranges that carry it from one station to the next (morphs). Pages write it; the
// lazily loaded engine reads it every frame. Kept free of three.js so it ships in main.

import type { ScrollTrigger } from 'gsap/ScrollTrigger';

export type FormationName = 'clover3d' | 'flatclover' | 'lattice' | 'dust' | 'wordmark' | 'strategy' | 'design' | 'development' | 'growth';

export interface Station {
  formation: FormationName;
  /** data-voxel-anchor value; 'viewport' = the whole screen */
  anchor: string;
  /** tilt: follows the pointer and breathes; flat: faces the camera; float: slow drift */
  pose?: 'tilt' | 'flat' | 'float';
  /** this station lights cells by fill order (stage.lit) */
  lit?: boolean;
  /** dim palette so text over it stays readable */
  dim?: boolean;
  /** pointer scatters the voxels here (footer wordmark, hero) */
  scatter?: boolean;
}

export interface Morph {
  st: ScrollTrigger;
  from: number;
  to: number;
}

export const stage = {
  stations: [] as Station[],
  morphs: [] as Morph[],
  /** bumps whenever a page sets a new script */
  version: 0,
  /** 0..33 cells lit on stations with `lit` */
  lit: 0,
  /** 0..1, gold leaf glow on completion */
  gold: 0,
  /** extra rotation added to tilt stations (the sandbox drags this) */
  spin: { yaw: 0, pitch: 0 },
};

export function setStage(stations: Station[], morphs: Morph[] = []) {
  stage.stations = stations;
  stage.morphs = morphs;
  stage.lit = 0;
  stage.gold = 0;
  stage.spin.yaw = 0;
  stage.spin.pitch = 0;
  stage.version++;
}

/** The engine registers itself here so pages and controls can poke it without importing three. */
export interface EngineHandle {
  explode(): void;
  setTheme(t: 'dark' | 'light'): void;
  setWire(on: boolean): void;
  freezeForSwap(): void;
  /** voxel sandbox: 'gravity' (toggle), 'explode', 'reset', 'brush' with a hex colour or null */
  sandbox(cmd: 'gravity' | 'explode' | 'reset' | 'brush', arg?: string | null): boolean;
  stats(): { instances: number; calls: number; triangles: number; tier: string; dpr: number; rendering: boolean };
  dispose(): void;
}

export const engineRef: { current: EngineHandle | null } = { current: null };
