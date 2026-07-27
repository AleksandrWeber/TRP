import { describe, expect, it } from 'vitest';
import { deduplicate } from './deduplicate';

describe('deduplicate', () => {
  it('removes duplicate strings', () => {
    expect(deduplicate(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
  });

  it('dedupes by id when present', () => {
    expect(
      deduplicate([
        { id: '1', title: 'One' },
        { id: '2', title: 'Two' },
        { id: '1', title: 'One again' },
      ]),
    ).toEqual([
      { id: '1', title: 'One' },
      { id: '2', title: 'Two' },
    ]);
  });

  it('dedupes by title when id is missing', () => {
    expect(deduplicate([{ title: 'Same' }, { title: 'Same' }, { title: 'Other' }])).toEqual([
      { title: 'Same' },
      { title: 'Other' },
    ]);
  });
});
