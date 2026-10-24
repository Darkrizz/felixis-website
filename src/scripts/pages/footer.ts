// The footer wordmark station, shared by every page script. On short pages the footer is
// already on screen before anyone scrolls, which would start the morph at load; there the
// footer keeps its DOM wordmark instead and the voxels stay with the page.

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Morph, Station } from '../core/stage';

export function footerStation(stations: Station[], morphs: Morph[]) {
  const footer = document.querySelector<HTMLElement>('[data-footer]');
  if (!footer) return;
  const top = footer.getBoundingClientRect().top + scrollY;
  if (top - innerHeight < innerHeight * 0.35) {
    footer.dataset.wordmark = 'dom';
    return;
  }
  delete footer.dataset.wordmark;
  const from = stations.length - 1;
  stations.push({ formation: 'wordmark', anchor: 'footer', pose: 'flat', scatter: true });
  morphs.push({ st: ScrollTrigger.create({ id: 'm-footer', trigger: footer, start: 'top bottom', end: 'top 25%' }), from, to: from + 1 });
}
