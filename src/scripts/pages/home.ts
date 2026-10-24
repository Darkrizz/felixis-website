// Home page choreography. Triggers are created in DOM order (each morph range, then the pin
// it leads into) so pin spacing is always measured before anything below it.

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrubWords } from '../effects/fx';
import { reducedMotion, PIN_QUERY } from '../core/prefs';
import { setStage, type Morph, type Station } from '../core/stage';
import { leaves } from '../sections/leaves';
import { footerStation } from './footer';

const desktop = () => matchMedia(PIN_QUERY).matches;

export default function home() {
  const reduced = reducedMotion();
  const pin = desktop() && !reduced;
  const cleanups: (() => void)[] = [];
  const stations: Station[] = [{ formation: 'clover3d', anchor: 'hero', pose: 'tilt', scatter: true }];
  const morphs: Morph[] = [];

  /** Add a station and the scroll range that morphs into it. */
  const to = (station: Station, trigger: Element, start: string, end: string, id: string) => {
    const from = stations.length - 1;
    stations.push(station);
    morphs.push({ st: ScrollTrigger.create({ id, trigger, start, end }), from, to: from + 1 });
  };

  // --- statement: clover -> lattice, then a pinned word scrub
  const statement = document.querySelector<HTMLElement>('[data-pin="statement"]');
  const text = statement?.querySelector<HTMLElement>('[data-fx="scrub-words"]');
  if (statement && text) {
    const words = scrubWords(text);
    cleanups.push(words.revert);
    to({ formation: 'lattice', anchor: 'statement', pose: 'flat', dim: true }, statement, 'top bottom', 'top 15%', 'm-statement');
    if (!reduced) {
      ScrollTrigger.create({
        id: 'statement',
        trigger: statement,
        start: pin ? 'top top' : 'top 75%',
        end: pin ? '+=110%' : 'bottom 55%',
        pin,
        scrub: true,
        onUpdate: (self) => words.set(self.progress),
      });
    }
  }

  // --- four leaves: lattice -> flat clover that lights cell by cell
  const leavesEl = document.querySelector<HTMLElement>('[data-pin="leaves"]');
  if (leavesEl) {
    to({ formation: 'flatclover', anchor: 'leaves', pose: 'flat', lit: true }, leavesEl, 'top bottom', pin ? 'top top' : 'top 30%', 'm-leaves');
    cleanups.push(leaves(leavesEl, { pin, reduced }));
  }

  // --- range: the clover dissolves into drifting dust while the stage has the floor
  const range = document.querySelector<HTMLElement>('[data-section="range"]');
  if (range) to({ formation: 'dust', anchor: 'viewport', pose: 'flat' }, range, 'top bottom', 'top 20%', 'm-range');

  // --- proof: a small clover beside the live readouts
  const proof = document.querySelector<HTMLElement>('[data-section="proof"]');
  if (proof) to({ formation: 'clover3d', anchor: 'proof', pose: 'tilt', scatter: true }, proof, 'top bottom', 'top 30%', 'm-proof');

  // --- footer wordmark
  footerStation(stations, morphs);

  setStage(stations, morphs);
  return () => cleanups.forEach((fn) => fn());
}
