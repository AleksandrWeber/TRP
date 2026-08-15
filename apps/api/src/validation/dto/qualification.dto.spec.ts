import { describe, expect, it } from 'vitest';
import { QUALIFICATION_PRODUCT_MODE_VALUES } from './qualification.dto';

describe('PC-08 qualification DTOs', () => {
  it('offers lab and paper only — not live capital', () => {
    expect(QUALIFICATION_PRODUCT_MODE_VALUES).toEqual(['lab', 'paper']);
    expect(QUALIFICATION_PRODUCT_MODE_VALUES).not.toContain('live');
  });
});
