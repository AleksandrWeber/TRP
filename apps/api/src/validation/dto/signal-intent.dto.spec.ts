import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ListSignalIntentsQueryDto, SignalIntentIdParamDto } from './signal-intent.dto';

describe('US214 — Signal Intent DTOs', () => {
  it('accepts a valid intent id param', () => {
    const dto = plainToInstance(SignalIntentIdParamDto, { id: 'si_abc' });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects empty sessionId query', () => {
    const dto = plainToInstance(ListSignalIntentsQueryDto, { sessionId: '' });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('accepts a session list query', () => {
    const dto = plainToInstance(ListSignalIntentsQueryDto, { sessionId: 'session-1' });
    expect(validateSync(dto)).toHaveLength(0);
  });
});
