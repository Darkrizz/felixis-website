// Demos load their code only when they come near the viewport, and stay alive until the
// page swaps.

type Cleanup = () => void;

const LOADERS: Record<string, () => Promise<{ default: (el: HTMLElement) => Cleanup | void }>> = {
  sitemap: () => import('./sitemap'),
  palette: () => import('./palette'),
  container: () => import('./container'),
  snippet: () => import('./snippet'),
  range: () => import('../sections/range'),
  'lab-thumbs': () => import('./labThumbs'),
  proof: () => import('./proof'),
  positioning: () => import('./positioning'),
  typescale: () => import('./typescale'),
  spring: () => import('./spring'),
  funnel: () => import('./funnel'),
  sandbox: () => import('../lab/sandbox'),
  sequencer: () => import('../lab/sequencer'),
  mark: () => import('../lab/mark'),
  type: () => import('../lab/type'),
  cells: () => import('../lab/cells'),
  flow: () => import('../lab/flow'),
  brief: () => import('./brief'),
  lost: () => import('./lost'),
};

export function registerDemoLoader(name: string, loader: (typeof LOADERS)[string]) {
  LOADERS[name] = loader;
}

export function bindDemos(scope: ParentNode = document): Cleanup {
  const cleanups: Cleanup[] = [];
  let alive = true;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        const load = LOADERS[el.dataset.demo || ''];
        if (!load) continue;
        load().then((m) => {
          if (!alive) return;
          const c = m.default(el);
          if (c) cleanups.push(c);
          el.dataset.demoReady = '1';
        });
      }
    },
    { rootMargin: '100% 0px' },
  );
  scope.querySelectorAll<HTMLElement>('[data-demo]').forEach((el) => io.observe(el));
  return () => {
    alive = false;
    io.disconnect();
    cleanups.forEach((fn) => fn());
  };
}
