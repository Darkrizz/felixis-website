// Long-form content for the four service pages. Plain statements of what the work involves;
// no client names, results or statistics, because the studio hasn't supplied any yet.

export interface ServiceDetail {
  key: 'strategy' | 'design' | 'development' | 'growth';
  title: string;
  description: string;
  hero: string;
  intro: string;
  deliverables: { title: string; text: string }[];
  demos: { id: string; title: string; text: string }[];
  faq: { q: string; a: string }[];
}

export const DETAIL: Record<ServiceDetail['key'], ServiceDetail> = {
  strategy: {
    key: 'strategy',
    title: 'Website strategy and planning | Felixis',
    description: 'Audience, goals, sitemap and content plan before anything gets designed. The first leaf of the Felixis clover.',
    hero: 'Decide what the site is for before anyone draws it.',
    intro:
      "Most redesigns go wrong in the first week, when nobody writes down who the site is for or what it has to do. Strategy is where we settle that: the people you're trying to reach, the one or two things they should do, and the smallest set of pages that gets them there.",
    deliverables: [
      { title: 'Audience and goals', text: 'Who visits, what they came for, and what you need them to do. Written down in plain language and agreed before design starts.' },
      { title: 'Sitemap and content plan', text: 'Every page, what it says and who writes it. We plan the content first so the design has something real to hold.' },
      { title: 'Competitor teardown', text: 'What the sites you compete with do well, where they lose people, and the gap you can stand in.' },
      { title: 'Measures of success', text: 'The numbers we will check after launch, chosen now, so nobody argues about whether it worked.' },
    ],
    demos: [
      { id: 'sitemap', title: 'Grow a sitemap', text: 'Click a page to give it a child. The tree lays itself out again every time.' },
      { id: 'positioning', title: 'Find your position', text: 'Drag your brand across two axes and see what the territory says about you.' },
    ],
    faq: [
      { q: 'Do we need strategy if we already know what we want?', a: 'Then this part is short. We still write it down, because a one-page brief settles arguments later that would otherwise cost weeks.' },
      { q: 'What do you need from us?', a: 'An hour or two with the people who know your customers best, access to any analytics you have, and honest answers about what is not working.' },
      { q: 'Can strategy be bought on its own?', a: 'Yes. Some teams take the plan to their own designers, and the documents are written so anyone can pick them up.' },
    ],
  },
  design: {
    key: 'design',
    title: 'Web and brand design | Felixis',
    description: 'Visual identity, interface design and motion, drawn for one brand at a time. The gold leaf of the Felixis clover.',
    hero: "A look that belongs to you and can't be mistaken for anyone else's.",
    intro:
      'Design is the leaf we coloured gold. We start from what makes you different, pick type and colour that carry it, and then design every screen, state and transition, including the error messages and the empty pages most teams forget.',
    deliverables: [
      { title: 'Visual identity', text: 'Logo, colour, type and the rules for using them, or a careful refresh of the ones you already have.' },
      { title: 'Interface design', text: 'Every page at phone, tablet and desktop widths, with hover, focus, loading, empty and error states drawn.' },
      { title: 'Motion language', text: 'How things move and why: the eases, the timings and the moments that deserve animation.' },
      { title: 'Design system', text: 'Tokens and components your team can extend without asking us, documented where they live.' },
    ],
    demos: [
      { id: 'range', title: 'Six design languages', text: 'The same poster set six ways. Range is a skill you can test, so test it.' },
      { id: 'palette', title: 'A palette that checks itself', text: 'One hue, six steps in OKLCH, and a live contrast check on every swatch.' },
      { id: 'typescale', title: 'Type scale', text: 'Pick a base size and a ratio. Every step of the scale renders in the brand face.' },
    ],
    faq: [
      { q: 'Will it look like this website?', a: "No. This site is designed around the Felixis clover. Yours starts from your brand, and the Range stage above shows how far apart two directions can sit." },
      { q: 'Do you design in the browser?', a: 'Early, yes. Layouts start as static frames, but motion and responsive behaviour are hard to judge until they run, so we move into code sooner than most.' },
      { q: 'How many rounds of changes are included?', a: 'We agree it per project. Most changes are cheap when the strategy is settled, which is why that leaf comes first.' },
    ],
  },
  development: {
    key: 'development',
    title: 'Website and web app development | Felixis',
    description: 'Hand-built sites and web apps that load fast on cheap phones, pass accessibility checks and stay readable without JavaScript.',
    hero: 'Hand-built, quick on a cheap phone, and readable with JavaScript off.',
    intro:
      'We write the code ourselves, so the site does only what it needs to. Pages are rendered as plain HTML first, the effects arrive after, and the budget for every kilobyte is checked by the build, not by hope.',
    deliverables: [
      { title: 'Marketing sites and web apps', text: 'Static or server-rendered, built with tools chosen for the job, not for the CV.' },
      { title: 'Content management', text: 'A CMS your team can actually use, set up with the fields your pages need and nothing more.' },
      { title: 'Accessibility', text: 'Keyboard use, screen readers, contrast and reduced motion, built to WCAG 2.2 AA and tested.' },
      { title: 'Performance budgets', text: 'Size limits for scripts, styles and images that fail the build when someone breaks them.' },
    ],
    demos: [
      { id: 'spring', title: 'Spring physics, live', text: 'Change stiffness and damping. The code rewrites itself and the square obeys it.' },
      { id: 'container', title: 'Container queries', text: 'One card, three layouts, chosen by the space it gets. No JavaScript decides it.' },
      { id: 'proof', title: 'This page, measured', text: "The same live readout as the home page, running on this page's own numbers." },
    ],
    faq: [
      { q: 'Which stack do you use?', a: 'This site runs on Astro, GSAP and three.js. For yours we pick what fits the content, the team that will maintain it and the hosting you already pay for.' },
      { q: 'Will the effects slow the site down?', a: "Not if they're budgeted. Here the 3D engine only loads after the page is ready, and it stays off on devices that ask for less motion or less data." },
      { q: 'Do you hand over the code?', a: 'Yes. It lives in your repository with a README that explains how to run it, change it and deploy it.' },
    ],
  },
  growth: {
    key: 'growth',
    title: 'SEO, speed and analytics after launch | Felixis',
    description: 'Technical SEO, Core Web Vitals and readable analytics, with monthly changes based on what visitors actually do.',
    hero: 'Launch is the middle of the work, not the end.',
    intro:
      'A site starts learning the day it goes live. Growth is the leaf that keeps it learning: we watch how people find you and where they give up, then change one thing at a time and check whether it helped.',
    deliverables: [
      { title: 'Technical SEO', text: 'Titles, structured data, sitemaps and the plumbing search engines need to read you properly.' },
      { title: 'Core Web Vitals', text: 'Loading, responsiveness and layout stability kept in the green as content and features pile up.' },
      { title: 'Analytics you can read', text: 'A short monthly note on what changed and what to do about it, instead of a dashboard nobody opens.' },
      { title: 'Monthly iteration', text: 'Small, measured changes to pages, copy and flows, each one checked against the numbers we agreed.' },
    ],
    demos: [
      { id: 'snippet', title: 'Search snippet preview', text: 'Edit a title and description. The preview cuts them off by measured pixel width.' },
      { id: 'funnel', title: 'Where visitors go', text: 'Put in your own traffic and conversion rates, and see where the biggest gain is hiding.' },
      { id: 'proof', title: 'Vitals on this page', text: 'Live loading and stability numbers for the page you are reading.' },
    ],
    faq: [
      { q: 'Can you guarantee a ranking?', a: 'No, and nobody honest can. We can make sure search engines read every page correctly and that the pages answer what people search for.' },
      { q: 'Do you only look after sites you built?', a: 'No. We start with an audit of what you have and fix the problems that cost you visitors first.' },
      { q: 'How long until we see changes?', a: 'Speed and technical fixes show up in weeks. Search traffic takes longer, usually months, which is why we report monthly.' },
    ],
  },
};
