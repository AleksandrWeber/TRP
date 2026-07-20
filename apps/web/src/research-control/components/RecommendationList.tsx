type Props = {
  items: string[];
  title?: string;
  emptyMessage?: string;
};

export function RecommendationList({
  items,
  title = 'Recommendations',
  emptyMessage = 'No recommendations.',
}: Props) {
  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-sm text-sky-100"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
