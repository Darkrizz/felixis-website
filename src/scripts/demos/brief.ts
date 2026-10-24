// Brief builder. One step at a time, validated inline; each finished step lights a leaf of
// the clover. Sends to the configured endpoint, or opens a prefilled email when there is
// none (and keeps a copy on screen in case no mail app opens).

import { gsap } from 'gsap';
import { stage } from '../core/stage';
import { sound } from '../effects/sound';

export default function brief(form: HTMLFormElement) {
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('[data-step]')];
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const back = form.querySelector<HTMLButtonElement>('[data-back]')!;
  const send = form.querySelector<HTMLButtonElement>('[data-send]')!;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const done = form.querySelector<HTMLElement>('[data-done]')!;
  const nav = form.querySelector<HTMLElement>('[data-nav]')!;
  const dots = [...document.querySelectorAll<HTMLElement>('[data-step-dot]')];
  const svgCells = [...document.querySelectorAll<SVGRectElement>('[data-start-svg] .clover__cell')];
  let current = 0;

  const lit = (n: number) => {
    gsap.to(stage, { lit: n, duration: 0.9, ease: 'steps(8)' });
    svgCells.forEach((c) => c.classList.toggle('is-off', Number(c.dataset.seq) >= n));
  };

  const err = (name: string, msg: string) => {
    const el = form.querySelector<HTMLElement>(`[data-err="${name}"]`);
    if (el) el.textContent = msg;
    const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
    if (input && input.type !== 'checkbox' && input.type !== 'radio') input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };

  const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value?.trim() ?? '';

  const validate = (i: number) => {
    if (i === 0) return err('kind', form.querySelectorAll('input[name="kind"]:checked').length ? '' : 'Pick at least one, or "Not sure yet".');
    if (i === 1) return err('when', form.querySelector('input[name="when"]:checked') ? '' : 'Pick the closest option.');
    if (i === 2) {
      const a = err('name', value('name') ? '' : 'We need something to call you.');
      const email = value('email');
      const b = err('email', !email ? 'Add an email so we can reply.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'That email looks incomplete.');
      return a && b;
    }
    if (i === 3) return err('details', value('details').length >= 12 ? '' : 'A sentence or two is plenty.');
    return true;
  };

  const show = (i: number, focus = true) => {
    current = i;
    steps.forEach((s, k) => s.classList.toggle('is-current', k === i));
    dots.forEach((d, k) => {
      d.toggleAttribute('aria-current', false);
      if (k === i) d.setAttribute('aria-current', 'step');
      d.classList.toggle('is-done', k < i);
    });
    back.hidden = i === 0;
    next.classList.toggle('is-hidden', i === steps.length - 1);
    send.classList.toggle('is-shown', i === steps.length - 1);
    if (focus) steps[i].querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true });
  };

  const summary = () => {
    const kinds = [...form.querySelectorAll<HTMLInputElement>('input[name="kind"]:checked')].map((x) => x.value).join(', ');
    const when = form.querySelector<HTMLInputElement>('input[name="when"]:checked')?.value ?? '';
    const lines: (string | null)[] = [
      `Making: ${kinds}`,
      `When: ${when}`,
      value('budget') ? `Budget: ${value('budget')}` : null,
      `Name: ${value('name')}`,
      `Email: ${value('email')}`,
      value('company') ? `Company: ${value('company')}` : null,
      value('site') ? `Website: ${value('site')}` : null,
      '',
      value('details'),
    ];
    return lines.filter((x): x is string => x !== null).join('\n');
  };

  const finish = (text: string, copy: string | null) => {
    steps.forEach((s) => s.classList.remove('is-current'));
    nav.hidden = true;
    done.hidden = false;
    form.querySelector<HTMLElement>('[data-done-text]')!.textContent = text;
    if (copy) {
      const pre = form.querySelector<HTMLElement>('[data-done-copy]')!;
      pre.textContent = copy;
      pre.hidden = false;
      const btn = form.querySelector<HTMLButtonElement>('[data-copy]')!;
      btn.hidden = false;
      btn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(copy);
          status.textContent = 'Copied.';
        } catch {
          status.textContent = 'Copy was blocked; select the text above instead.';
        }
      };
    }
    dots.forEach((d) => d.classList.add('is-done'));
    lit(33);
    gsap.to(stage, { gold: 1, duration: 1, ease: 'expo.out', delay: 0.5 });
    sound.arpeggio();
    done.focus();
  };

  const onNext = () => {
    if (!validate(current)) {
      sound.tick(0);
      steps[current].querySelector<HTMLElement>('[aria-invalid="true"], input')?.focus();
      return;
    }
    lit((current + 1) * 8);
    sound.tick(3 + current * 2);
    show(current + 1);
  };

  const onSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    for (let i = 0; i < steps.length; i++) {
      if (!validate(i)) {
        show(i);
        return;
      }
    }
    if (value('_honey')) return; // honeypot (FormSubmit's field name)
    const endpoint = form.dataset.endpoint;
    const text = summary();
    if (endpoint) {
      send.disabled = true;
      status.textContent = 'Sending...';
      try {
        // FormSubmit's AJAX endpoint takes JSON; `email` becomes the reply-to address and
        // `_template: table` lays the brief out as a table in the inbox.
        const kinds = [...form.querySelectorAll<HTMLInputElement>('input[name="kind"]:checked')].map((x) => x.value).join(', ');
        const payload = {
          name: value('name'),
          email: value('email'),
          making: kinds,
          when: form.querySelector<HTMLInputElement>('input[name="when"]:checked')?.value ?? '',
          budget: value('budget') || 'not given',
          company: value('company') || 'not given',
          website: value('site') || 'not given',
          details: value('details'),
          _subject: `New project brief: ${value('name')}${value('company') ? ', ' + value('company') : ''}`,
          _template: 'table',
          _captcha: 'false',
          _honey: value('_honey'),
        };
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000),
        });
        const data = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
        if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || String(res.status));
        status.textContent = '';
        finish('Sent. Your brief is with us now, and you will be contacted soon.', null);
      } catch (err) {
        send.disabled = false;
        // FormSubmit answers "needs Activation" until the inbox owner confirms the form once
        const msg = err instanceof Error ? err.message : '';
        status.textContent = /activat/i.test(msg)
          ? 'The form is being switched on and can\x27t take briefs for a moment. Please email us directly.'
          : "That didn't go through. Check your connection and press Send again, or email us directly.";
      }
      return;
    }
    const subject = encodeURIComponent(`Project brief from ${value('name')}`);
    location.href = `mailto:${form.dataset.email}?subject=${subject}&body=${encodeURIComponent(text)}`;
    finish('Your email app should have opened with the brief written out. If it did not, copy it from below and send it to us.', text);
  };

  next.addEventListener('click', onNext);
  back.addEventListener('click', () => show(Math.max(0, current - 1)));
  form.addEventListener('submit', onSubmit);
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && current < steps.length - 1) {
      e.preventDefault();
      onNext();
    }
  });
  show(0, false);
  lit(0);
  return () => next.removeEventListener('click', onNext);
}
