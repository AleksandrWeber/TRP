import { describe, expect, it } from 'vitest';
import { AppService } from './app.service';

describe('AppService', () => {
  it('returns root payload', () => {
    const service = new AppService();
    expect(service.getRoot()).toEqual({
      name: 'TRP API',
      version: '0.1.0',
      status: 'ok',
    });
  });
});
