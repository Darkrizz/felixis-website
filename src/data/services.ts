// The four leaves. Order is the working sequence and the clover's fill order.

export interface Service {
  key: 'strategy' | 'design' | 'development' | 'growth';
  n: string;
  name: string;
  href: string;
  line: string;
  includes: string[];
  demoLabel: string;
  more: string;
}

export const SERVICES: Service[] = [
  {
    key: 'strategy',
    n: '01',
    name: 'Strategy',
    href: '/strategy/',
    line: 'Who the site is for, what it has to do, and which pages it needs to do it.',
    includes: ['Audience and goals', 'Sitemap and content plan', 'Competitor teardown', 'What success looks like, in numbers'],
    demoLabel: 'Click any page to give it a child page. The map lays itself out again.',
    more: 'More on strategy',
  },
  {
    key: 'design',
    n: '02',
    name: 'Design',
    href: '/design/',
    line: "Type, colour, layout and motion drawn for your brand and nobody else's.",
    includes: ['Visual identity', 'Interface design', 'Motion language', 'A design system your team can extend'],
    demoLabel: 'Pick a hue and a mood. The palette rebuilds itself and checks its own contrast.',
    more: 'More on design',
  },
  {
    key: 'development',
    n: '03',
    name: 'Development',
    href: '/development/',
    line: 'Hand-built, quick on a cheap phone, and still readable with JavaScript off.',
    includes: ['Marketing sites and web apps', 'Headless CMS setup', 'Accessibility to WCAG 2.2 AA', 'Performance budgets that fail the build'],
    demoLabel: 'Drag the handle. The card rearranges itself with container queries, no JavaScript involved.',
    more: 'More on development',
  },
  {
    key: 'growth',
    n: '04',
    name: 'Growth',
    href: '/growth/',
    line: 'Search, speed and analytics after launch, so the site keeps paying for itself.',
    includes: ['Technical SEO', 'Core Web Vitals', 'Analytics you can read', 'Monthly iteration'],
    demoLabel: 'Edit the title. The preview cuts it off where search results run out of room.',
    more: 'More on growth',
  },
];
