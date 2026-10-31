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
