/**
 * Deduplicate recommendation-like items by id, title, or string value.
 */

export function deduplicate<T extends string | { id?: string; title?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key =
      typeof item === 'string'
        ? item
        : item.id?.trim() || item.title?.trim() || JSON.stringify(item);

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}
