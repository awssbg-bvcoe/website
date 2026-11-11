/**
 * Daily clicks, last 30 days. One series in mint, so no legend (the heading names it).
 * Bars are thin with a 2px surface gap; each bar is a hover/focus target with a tooltip;
 * a visually hidden table carries the same data for screen readers.
 */
export function ClicksChart({ data }: { data: { day: string; clicks: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.clicks));
  const label = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const total = data.reduce((a, d) => a + d.clicks, 0);

  return (
    <figure>
      <div className="flex items-baseline justify-between gap-4">
        <figcaption className="font-mono text-lg font-bold">Clicks per day, last 30 days</figcaption>
        <p className="font-mono text-sm text-grey-300">
          <span className="text-paper">{total}</span> total, peak <span className="text-paper">{max}</span>
        </p>
      </div>
      <div className="relative mt-5 h-44" aria-hidden="true">
        {/* recessive gridlines at max and half */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-grey-700" />
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-grey-700" />
        <span className="absolute -top-2.5 right-0 bg-grey-850 pl-1 font-mono text-[11px] text-grey-300">{max}</span>
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {data.map((d) => (
            <div key={d.day} tabIndex={-1} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full bg-mint transition-colors group-hover:bg-paper"
                style={{ height: d.clicks ? `${Math.max(3, (d.clicks / max) * 100)}%` : "2px", opacity: d.clicks ? 1 : 0.35 }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 bg-paper px-2 py-1 font-mono text-xs whitespace-nowrap text-grey-850 group-hover:block">
                {label(d.day)}: {d.clicks}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-grey-300" aria-hidden="true">
        <span>{label(data[0]?.day ?? "")}</span>
        <span>{label(data[data.length - 1]?.day ?? "")}</span>
      </div>
      <table className="sr-only">
        <caption>Clicks per day, last 30 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Clicks</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{label(d.day)}</td>
              <td>{d.clicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Ranked breakdown (referrers, countries, devices) as labelled bars; values in text colour. */
export function Breakdown({ title, rows, empty }: { title: string; rows: { name: string; clicks: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.clicks));
  return (
    <div>
      <h3 className="font-mono text-sm font-bold text-grey-300 uppercase">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-grey-300">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {rows.map((r) => (
            <li key={r.name}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate text-paper">{r.name}</span>
                <span className="font-mono text-paper">{r.clicks}</span>
              </div>
              <div className="mt-1 h-1.5 bg-grey-800" aria-hidden="true">
                <div className="h-full bg-mint" style={{ width: `${(r.clicks / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
