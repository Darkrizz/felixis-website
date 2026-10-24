// Nav controls: theme, sound, motion, inspect, menu. The nav is persisted across page
// changes, so these bind once.

import { cover, uncover } from './cover';
import { sound } from './sound';
import { theme, saveTheme, reducedMotion, setReducedMotion } from '../core/prefs';
import { engineRef } from '../core/stage';
import { stopScroll, startScroll } from '../core/scroll';

const root = document.documentElement;
const all = (ctl: string) => document.querySelectorAll<HTMLButtonElement>(`[data-ctl="${ctl}"]`);
const announce = (msg: string) => {
  const el = document.querySelector('[data-announce]');
  if (el) el.textContent = msg;
};

function syncButtons() {
  const t = theme();
  all('theme').forEach((b) => {
    const label = b.querySelector('.sr-only');
    if (label) label.textContent = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  });
  all('sound').forEach((b) => b.setAttribute('aria-pressed', String(sound.on)));
  all('motion').forEach((b) => b.setAttribute('aria-pressed', String(!reducedMotion())));
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', t === 'dark' ? '#13201A' : '#EEF1EA');
}

export async function toggleTheme(e?: MouseEvent) {
  const next = theme() === 'dark' ? 'light' : 'dark';
  const ground = next === 'dark' ? '#13201A' : '#EEF1EA';
  await cover({ x: e?.clientX, y: e?.clientY, color: ground, accent: '#E8B422' });
  root.dataset.theme = next;
  saveTheme(next);
  engineRef.current?.setTheme(next);
  syncButtons();
  sound.tick(next === 'dark' ? 2 : 6);
  announce(next === 'dark' ? 'Dark theme' : 'Light theme');
  await uncover();
}

let inspectMod: Promise<typeof import('../inspect/index')> | null = null;
export const loadInspect = () => (inspectMod ??= import('../inspect/index'));

export async function toggleInspect(force?: boolean) {
  const mod = await loadInspect();
  const on = mod.toggle(force);
  all('inspect').forEach((b) => b.setAttribute('aria-pressed', String(on)));
  announce(on ? 'Inspect mode on' : 'Inspect mode off');
  sound.tick(on ? 8 : 3);
}

function menu() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-menu]');
  const opener = document.querySelector<HTMLButtonElement>('[data-ctl="menu"]');
  if (!dialog) return { open() {}, close() {} };
  const close = () => {
    if (!dialog.open) return;
    dialog.close();
  };
  dialog.addEventListener('close', () => {
    startScroll();
    opener?.focus();
  });
  dialog.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) close();
  });
  return {
    async open(e?: MouseEvent) {
      await cover({ x: e?.clientX, y: e?.clientY, color: getComputedStyle(root).getPropertyValue('--ground').trim() || '#13201A' });
      stopScroll();
      dialog.showModal();
      await uncover();
    },
    close,
  };
}

export function initControls() {
  syncButtons();
  const m = menu();
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-ctl]');
    if (!btn) return;
    switch (btn.dataset.ctl) {
      case 'theme':
        toggleTheme(e);
        break;
      case 'sound':
        sound.set(!sound.on);
        syncButtons();
        announce(sound.on ? 'Sound on' : 'Sound off');
        break;
      case 'motion':
        setReducedMotion(!reducedMotion());
        syncButtons();
        announce(reducedMotion() ? 'Animation off' : 'Animation on');
        break;
      case 'inspect':
        toggleInspect();
        break;
      case 'menu':
        m.open(e);
        break;
      case 'menu-close':
        m.close();
        break;
      case 'explode':
        engineRef.current?.explode();
        sound.tick(9);
        break;
    }
  });

  // Inspect prefetch on hover, and the I shortcut (never while typing).
  all('inspect').forEach((b) => b.addEventListener('pointerenter', () => loadInspect(), { once: true }));
  addEventListener('keydown', (e) => {
    if (e.key !== 'i' && e.key !== 'I') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (matchMedia('(max-width: 1100px)').matches) return;
    toggleInspect();
  });

  // Primary buttons chirp when sound is on.
  document.addEventListener('pointerenter', (e) => {
    const t = e.target as HTMLElement;
    if (t instanceof HTMLElement && t.matches('.btn--gold')) sound.chirp();
  }, true);
}
