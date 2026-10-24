// Choreography for pages without a bespoke script (lab, experiments, start, 404): the page's
// formation at its own anchor (or drifting behind everything), then the footer wordmark.

import { footerStation } from './footer';
import { setStage, type FormationName, type Morph, type Station } from '../core/stage';

export default function generic() {
  const main = document.querySelector<HTMLElement>('main');
  const formation = (main?.dataset.formation ?? 'dust') as FormationName;
  const anchor = document.querySelector<HTMLElement>('main [data-voxel-anchor]');
  const stations: Station[] = [
    anchor
      ? { formation, anchor: anchor.dataset.voxelAnchor!, pose: formation === 'clover3d' ? 'tilt' : formation === 'flatclover' ? 'flat' : 'float', scatter: formation !== 'flatclover', lit: formation === 'flatclover' }
      : { formation: 'dust', anchor: 'viewport', pose: 'flat' },
  ];
  const morphs: Morph[] = [];
  footerStation(stations, morphs);
  setStage(stations, morphs);
}
