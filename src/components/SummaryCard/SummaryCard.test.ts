import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SummaryCard } from './SummaryCard';
import { makeT } from '../../i18n';
import { toggleMuscle, updateEntry, type Selection } from '../../state/selection';

const render = (sel: Selection, lang: 'en' | 'zh') =>
  renderToStaticMarkup(createElement(SummaryCard, { selection: sel, t: makeT(lang) }));

describe('SummaryCard', () => {
  const sel = updateEntry(toggleMuscle(toggleMuscle({}, 'hamstrings-l'), 'biceps-r'), 'hamstrings-l', {
    intensity: 'deep',
    duration: 45,
    note: '避开这里，旧伤',
  });

  it('renders in English and Chinese, grouped by side, with intensity, duration and note', () => {
    const en = render(sel, 'en');
    expect(en).toContain('Front of body');
    expect(en).toContain('Back of body');
    expect(en).toContain('Deep');
    expect(en).toContain('45 min');
    expect(en).toContain('Back of thigh (left)');
    const zh = render(sel, 'zh');
    expect(zh).toContain('很重');
    expect(zh).toContain('45 分钟');
    expect(zh).toContain('大腿后面（左）');
    expect(zh).toContain('避开这里，旧伤'); // note shown exactly as typed
    expect(en).toContain('避开这里，旧伤');
    expect(en.indexOf('Front of body')).toBeLessThan(en.indexOf('Back of body'));
  });

  it('renders notes as plain text (HTML is escaped, never injected)', () => {
    const evil = updateEntry(toggleMuscle({}, 'hand-front-l'), 'hand-front-l', { note: '<img src=x onerror=alert(1)><script>alert(2)</script>' });
    const html = render(evil, 'en');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('shows a note with a warning icon and text label, not colour alone', () => {
    const html = render(sel, 'en');
    expect(html).toContain('⚠');
    expect(html).toContain('Note: ');
  });

  it('shows an empty state', () => {
    expect(render({}, 'en')).toContain('No areas selected yet.');
    expect(render({}, 'zh')).toContain('还没选部位。');
  });
});
