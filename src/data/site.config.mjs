// Studio facts. Nothing here was invented: optional values stay null/empty and are simply
// not shown on the site until they are filled in.

export const site = {
  name: 'Felixis',
  /** The registered company name: used in the footer copyright and as legalName in JSON-LD. */
  legalName: 'Felixis',
  /** How the studio is referred to everywhere else (titles, social cards, JSON-LD name). */
  tradingName: 'Felixis Web Solutions',
  /** The live domain: canonical URLs, sitemap, robots.txt and social cards. */
  url: 'https://felixis.dev',
  /** The studio inbox: shown in the footer and where FormSubmit delivers /start/ briefs. */
  email: 'officialtanishqjain@gmail.com',
  /** Phone, as displayed. Also on WhatsApp (see `whatsapp`). @type {string | null} */
  phone: '+91 99996 53491',
  /** WhatsApp number in international digits for wa.me links, or null to hide. @type {string | null} */
  whatsapp: '919999653491',
  /** Optional: city or "Remote"; hidden while null. @type {string | null} */
  location: null,
  /**
   * The /start/ brief goes through FormSubmit (formsubmit.co), the same service the Thrafford
   * site uses: no account or API key, it emails each submission to `email` above. The very
   * first submission sends a one-time "Activate form" email to that inbox; click it once.
   * After activating, FormSubmit also offers a random alias you can paste here instead of the
   * address so the real email isn't visible in the page source. @type {string | null}
   */
  formSubmitAlias: null,
  /** Optional: real profiles only. Empty entries are hidden (footer and JSON-LD sameAs). */
  socials: [
    { label: 'Instagram', handle: '@theonlytanishq', href: 'https://www.instagram.com/theonlytanishq/' },
  ],
};

/** Required values that still look like placeholders (the build fails the check if any remain). */
export function unfilled() {
  const missing = [];
  if (site.url.includes('.example')) missing.push('url');
  if (site.email.includes('.example')) missing.push('email');
  return missing;
}

/** Optional facts not filled in yet (hidden on the site, listed by the build for reference). */
export function optionalEmpty() {
  const out = [];
  if (!site.phone) out.push('phone');
  if (!site.location) out.push('location');
  if (!site.socials.some((s) => s.href)) out.push('socials');
  return out;
}

/** FormSubmit's AJAX endpoint for the brief builder, or null while the inbox is still a placeholder. */
export function formEndpoint() {
  const to = site.formSubmitAlias || site.email;
  if (!to || to.includes('.example')) return null;
  return `https://formsubmit.co/ajax/${to}`;
}
