export interface SelectOption<V extends string> {
  value: V;
  label: string;
}

interface Props<V extends string> {
  label: string;
  options: readonly SelectOption<V>[];
  /** null shows the placeholder (used by "set all", which has no current value) */
  value: V | null;
  placeholder?: string;
  onChange: (v: V) => void;
  className?: string;
}

/** A compact native dropdown with a small caption. Native <select> gives the phone's own big, easy picker. */
export function Select<V extends string>({ label, options, value, placeholder = '—', onChange, className = '' }: Props<V>) {
  return (
    <label className={`sel ${className}`}>
      <span className="sel-k">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value as V);
        }}
      >
        {value === null && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
