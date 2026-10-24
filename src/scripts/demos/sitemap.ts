// Sitemap demo: a tidy top-down tree. Clicking a page adds a child; nodes glide to their
// new places and the connectors are redrawn every frame of the move.

import { gsap } from 'gsap';
import { sound } from '../effects/sound';

interface Node {
  id: number;
  label: string;
  depth: number;
  children: Node[];
  x: number;
  y: number;
  el?: HTMLButtonElement;
}

const POOL: Record<string, string[]> = {
  Home: ['Pricing', 'Blog', 'Careers', 'FAQ'],
  Services: ['Strategy', 'Design', 'Development', 'Growth'],
  Work: ['Case study', 'Archive'],
  About: ['Team', 'Values', 'Press'],
  Contact: ['Book a call', 'Locations'],
  Blog: ['Article', 'Tags'],
  Pricing: ['Plans', 'Compare'],
  default: ['Detail', 'Overview', 'Guide'],
};

const MAX_NODES = 15;
const MAX_DEPTH = 2;

export default function sitemap(root: HTMLElement) {
  const nodesEl = root.querySelector<HTMLElement>('.sitemap__nodes')!;
  const svg = root.querySelector<SVGSVGElement>('.sitemap__lines')!;
  const countEl = root.querySelector<HTMLElement>('[data-count]')!;
  let nextId = 0;
  let tree: Node;
  const used = new Map<string, number>();

  const make = (label: string, depth: number): Node => ({ id: nextId++, label, depth, children: [], x: 0, y: 0 });

  const reset = () => {
    nodesEl.innerHTML = '';
    used.clear();
    tree = make('Home', 0);
    tree.children = ['Services', 'Work', 'About', 'Contact'].map((l) => make(l, 1));
    render(false);
  };

  const all = (n: Node, out: Node[] = []) => {
    out.push(n);
    n.children.forEach((c) => all(c, out));
    return out;
  };

  // tidy layout: leaves get evenly spaced columns, parents sit over their children
  const layout = () => {
    const w = nodesEl.clientWidth;
    const h = nodesEl.clientHeight;
    const leaves: Node[] = [];
    const collect = (n: Node) => (n.children.length ? n.children.forEach(collect) : leaves.push(n));
    collect(tree);
    const colW = w / leaves.length;
    leaves.forEach((l, i) => (l.x = colW * (i + 0.5)));
    const place = (n: Node): number => {
      if (n.children.length) n.x = n.children.map(place).reduce((a, b) => a + b, 0) / n.children.length;
      n.y = 22 + n.depth * Math.min(92, (h - 50) / 2.2);
      return n.x;
    };
    place(tree);
  };

  const draw = () => {
    const paths: string[] = [];
    const walk = (n: Node) => {
      for (const c of n.children) {
        const midY = (n.y + c.y) / 2;
        paths.push(`<path d="M${n.x.toFixed(1)} ${n.y + 16} V${midY.toFixed(1)} H${c.x.toFixed(1)} V${(c.y - 16).toFixed(1)}"/>`);
        walk(c);
      }
    };
    walk(tree);
    svg.innerHTML = paths.join('');
  };

  const render = (animate: boolean, fresh?: Node) => {
    layout();
    const nodes = all(tree);
    const live = { t: 0 };
    for (const n of nodes) {
      if (!n.el) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sm-node nx';
        b.dataset.size = 's';
        b.dataset.depth = String(n.depth);
        b.textContent = n.label;
        b.setAttribute('aria-label', `${n.label}. Add a page under ${n.label}`);
        b.addEventListener('click', () => grow(n));
        nodesEl.appendChild(b);
        n.el = b;
        const parent = nodes.find((p) => p.children.includes(n));
        gsap.set(b, { x: (parent?.x ?? n.x) - b.offsetWidth / 2, y: (parent?.y ?? n.y) - 16, scale: animate ? 0.4 : 1, opacity: animate ? 0 : 1 });
      }
    }
    const targets = nodes.map((n) => ({ n, from: { x: Number(gsap.getProperty(n.el!, 'x')), y: Number(gsap.getProperty(n.el!, 'y')) } }));
    gsap.to(live, {
      t: 1,
      duration: animate ? 0.7 : 0,
      ease: 'expo.out',
      onUpdate: () => {
        for (const { n, from } of targets) {
          const tx = n.x - n.el!.offsetWidth / 2;
          const ty = n.y - 16;
          gsap.set(n.el!, { x: from.x + (tx - from.x) * live.t, y: from.y + (ty - from.y) * live.t });
        }
        // connectors follow the nodes' current (moving) positions
        const saved = nodes.map((n) => [n.x, n.y]);
        for (const n of nodes) {
          n.x = Number(gsap.getProperty(n.el!, 'x')) + n.el!.offsetWidth / 2;
          n.y = Number(gsap.getProperty(n.el!, 'y')) + 16;
        }
        draw();
        nodes.forEach((n, i) => ([n.x, n.y] = saved[i]));
      },
    });
    nodes.forEach((n) => {
      if (n.el && Number(gsap.getProperty(n.el, 'opacity')) < 1) gsap.to(n.el, { scale: 1, opacity: 1, duration: 0.36, ease: 'steps(4)', delay: 0.1 });
      n.el?.classList.toggle('is-new', n === fresh);
    });
    countEl.textContent = `${nodes.length} pages, ${Math.max(...nodes.map((n) => n.depth)) + 1} levels`;
  };

  const grow = (n: Node) => {
    const total = all(tree).length;
    if (total >= MAX_NODES) {
      countEl.textContent = `${total} pages. That's a full site; reset to start again.`;
      sound.tick(0);
      return;
    }
    if (n.depth >= MAX_DEPTH) {
      countEl.textContent = 'Three levels deep is plenty for most sites.';
      sound.tick(1);
      return;
    }
    const pool = POOL[n.label] ?? POOL.default;
    const k = used.get(n.label) ?? 0;
    used.set(n.label, k + 1);
    const label = pool[k % pool.length];
    const child = make(label, n.depth + 1);
    n.children.push(child);
    sound.tick(3 + n.depth * 2 + (k % 3));
    render(true, child);
  };

  root.querySelector('[data-reset]')?.addEventListener('click', reset);
  const ro = new ResizeObserver(() => render(false));
  ro.observe(nodesEl);
  reset();
  return () => ro.disconnect();
}
