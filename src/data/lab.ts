// Lab experiments. Each one has its own page at /lab/<slug>/.

export interface Experiment {
  slug: string;
  title: string;
  line: string;
  how: string;
  /** voxel formation the page opens with */
  formation: string;
}

export const LAB: Experiment[] = [
  {
    slug: 'voxel-sandbox',
    title: 'Voxel sandbox',
    line: 'The clover from the home page, with gravity you can switch on and cells you can paint.',
    how: 'three.js, one instanced mesh, a spring simulation per cube',
    formation: 'clover3d',
  },
  {
    slug: 'sequencer',
    title: 'Clover sequencer',
    line: 'The 33 cells of the mark as a step sequencer. Click cells to make a loop.',
    how: 'Web Audio oscillators, scheduled ahead on the audio clock',
    formation: 'flatclover',
  },
  {
    slug: 'make-a-mark',
    title: 'Make a mark',
    line: 'Draw your own pixel mark on the same 7 by 7 grid and download it as an SVG.',
    how: 'Pointer events, path merging, SVG export',
    formation: 'lattice',
  },
  {
    slug: 'type-playground',
    title: 'Type playground',
    line: 'Three variable fonts whose weight and width follow your pointer and your scroll speed.',
    how: 'Variable font axes, font-variation-settings, no images',
    formation: 'dust',
  },
  {
    slug: 'cell-shader',
    title: 'Cell shader',
    line: 'A fragment shader that turns colour into cells. Drag to paint light into it.',
    how: 'WebGL2 fragment shader, ping-pong buffers',
    formation: 'dust',
  },
  {
    slug: 'flow-field',
    title: 'Flow field',
    line: 'Thousands of cells drifting on curl noise, in the brand colours.',
    how: 'Canvas 2D, curl noise, one draw pass per frame',
    formation: 'dust',
  },
];
