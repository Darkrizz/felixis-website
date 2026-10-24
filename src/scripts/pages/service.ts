// Service page choreography: the leaf's glyph in the hero, the clover lit up to this leaf in
// "Leaf n of 4", the wordmark in the footer. Range and Proof sections, when the page has
// them, get the same stations they have on the home page.

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { footerStation } from './footer';
import { setStage, stage, type FormationName, type Morph, type Station } from '../core/stage';

export default function service() {
  const hero = document.querySelector<HTMLElement>('[data-service]');
  const key = (hero?.dataset.service ?? 'strategy') as FormationName;
  const stations: Station[] = [{ formation: key, anchor: 'service', pose: 'float', scatter: true }];
  const morphs: Morph[] = [];
  const to = (station: Station, trigger: Element, start: string, end: string, id: string) => {
    const from = stations.length - 1;
    stations.push(station);
    morphs.push({ st: ScrollTrigger.create({ id, trigger, start, end }), from, to: from + 1 });
  };

  // walk the page in DOM order so every morph is created top to bottom
  for (const el of document.querySelectorAll<HTMLElement>('[data-section="range"], [data-section="proof"], .sv-fit')) {
    if (el.dataset.section === 'range') to({ formation: 'dust', anchor: 'viewport', pose: 'flat' }, el, 'top bottom', 'top 20%', 'm-range');
    else if (el.dataset.section === 'proof') to({ formation: 'clover3d', anchor: 'proof', pose: 'tilt', scatter: true }, el, 'top bottom', 'top 30%', 'm-proof');
    else to({ formation: 'flatclover', anchor: 'fit', pose: 'flat', lit: true }, el, 'top bottom', 'top 35%', 'm-fit');
  }
  footerStation(stations, morphs);

  setStage(stations, morphs);
  // the fit clover is lit up to the end of this leaf, the same in SVG and in voxels
  const svg = document.querySelector<SVGSVGElement>('[data-fit-svg]');
  const upto = Number(svg?.dataset.upto ?? 33);
  stage.lit = upto;
  svg?.querySelectorAll<SVGRectElement>('.clover__cell').forEach((c) => c.classList.toggle('is-off', Number(c.dataset.seq) >= upto));
}
