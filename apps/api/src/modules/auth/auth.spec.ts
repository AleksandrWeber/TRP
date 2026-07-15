import { describe, expect, it } from 'vitest';
import * as bcrypt from 'bcrypt';

describe('auth password hashing', () => {
  it('hashes and verifies passwords with bcrypt', async () => {
    const hash = await bcrypt.hash('secret', 10);
    expect(hash).not.toBe('secret');
    expect(await bcrypt.compare('secret', hash)).toBe(true);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });
});
