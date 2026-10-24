// Entry point. Loaded once; Astro's ClientRouter keeps it alive across page changes.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { startTicker } from './core/ticker';
import { initScroll } from './core/scroll';
import { initRouter } from './core/router';
import { initControls } from './effects/controls';
import { initNavProgress } from './effects/navProgress';
import { bootGL } from './core/glboot';
import { initDebug } from './core/debug';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('fx.swing', '0.65,0,0.35,1');
CustomEase.create('fx.glide', '0.16,1,0.3,1');

// The CSS preloader runs ~1.45s on a first visit; clear its class when it ends so the
// hero leaves its raised stacking layer (and the GL handoff waits for this).
const root = document.documentElement;
if (root.classList.contains('preload') || root.classList.contains('preload-page'))
  setTimeout(() => root.classList.remove('preload', 'preload-page'), Math.max(0, 1480 - performance.now()));

startTicker();
initScroll();
initControls();
initNavProgress();
initRouter();
bootGL();
initDebug();
