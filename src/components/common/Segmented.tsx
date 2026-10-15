import type { ReactNode } from 'react';

export interface SegOption<V extends string | number> {
  value: V;
  label: string;
  /** decorative extra (e.g. level bars) */
  extra?: ReactNode;
}

interface Props<V extends string | number> {
  label: string;
  options: readonly SegOption<V>[];
  value: V | null;
  onChange: (v: V) => void;
  className?: string;
}

/** A row of big toggle buttons (one active). Plain buttons with aria-pressed: works with tap, keyboard and screen readers. */
export function Segmented<V extends string | number>({ label, options, value, onChange, className = '' }: Props<V>) {
  return (
    <div className={`seg-wrap ${className}`}>
      <div className="seg-label">{label}</div>
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            className="seg-btn"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.extra}
            <span className="seg-text">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Level bars 1..4 (decorative; the text label carries the meaning). */
export function LevelBars({ level }: { level: number }) {
  return (
    <span className="level" aria-hidden="true">
      {[1, 2, 3, 4].map((n) => (
        <i key={n} className={n <= level ? 'on' : ''} style={{ height: 4 + n * 3 }} />
      ))}
    </span>
  );
}
