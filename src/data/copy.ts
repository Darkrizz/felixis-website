// All visible copy for shared chrome and the home page. Service, lab and start pages
// keep their copy in their own data files next to this one.

export const NAV = {
  links: [
    { label: 'Strategy', href: '/strategy/', leaf: 'strategy' },
    { label: 'Design', href: '/design/', leaf: 'design' },
    { label: 'Development', href: '/development/', leaf: 'development' },
    { label: 'Growth', href: '/growth/', leaf: 'growth' },
    { label: 'Lab', href: '/lab/', leaf: 'lab' },
  ],
  cta: 'Start a project',
};

export const HOME = {
  title: 'Felixis Web Solutions | Web design, development and branding studio',
  description:
    'Felixis Web Solutions plans, designs, builds and grows websites, brands and web apps. Fast, accessible, hand-built sites, and a homepage you can play with.',
  hero: {
    title: 'Luck has nothing to do with it.',
    sub: 'We design and build websites, brands and web apps. Everything on this page runs live in your browser, so go ahead and poke at it.',
    secondary: 'How we work',
    hint: 'Drag across the clover, or click it.',
    hintTouch: 'Tap the clover to scatter it.',
  },
  statement:
    'Felix is Latin for lucky, which is a funny name for a studio that leaves nothing to chance. Our clover has four leaves and each one is a stage of the work: strategy, design, development and growth. Get all four right and people will call the result lucky.',
  leaves: {
    title: 'Four leaves, and the clover only completes when every one is done.',
    sub: 'Scroll through the stages. Each panel is a working tool, not a picture of one.',
  },
  range: {
    title: 'One word, multiple expressions.',
    sub: 'Every brand deserves its own look, so we keep a wide range on hand. Here is the same poster set six different ways; pick a style and watch it change.',
  },
  lab: {
    title: 'The lab',
    sub: 'Things we build to learn something new. All six run in your browser, and none of them is a video.',
    cta: 'Open the lab',
  },
  proof: {
    title: 'This page, measured on your device.',
    sub: "We can't show you borrowed case studies, so here are numbers instead. They come from your browser's own performance APIs while you read, and they'll change if you reload.",
    inspect: 'Inspect mode lays the grid, the type settings and every animation curve over the page itself.',
    inspectCta: 'Turn on Inspect',
    remeasure: 'Measure again',
  },
  contact: {
    title: 'Got a project that needs all four leaves?',
    sub: 'Tell us what you are making in four short steps. The brief lands straight in our inbox.',
  },
};
