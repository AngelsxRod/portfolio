/** Cinta decorativa del pie; repite los elementos para que el bucle no tenga huecos. */
export function Ticker({ items }: { items: string[] }) {
  const unique = [...new Set(items.map((item) => item.trim()).filter(Boolean))];
  if (unique.length === 0) return null;
  const run: string[] = [];
  while (run.length < 24) run.push(...unique);
  const text = `${run.join(" ✦ ")} ✦ `;
  return (
    <div className="os-ticker" aria-hidden="true">
      <div>
        {text}
        {text}
      </div>
    </div>
  );
}
