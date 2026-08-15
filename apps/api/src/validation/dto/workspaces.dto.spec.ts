import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { WorkspaceNameBodyDto } from './workspaces.dto';

describe('WorkspaceNameBodyDto (PC-14)', () => {
  it('accepts a trimmed-length name', () => {
    const dto = Object.assign(new WorkspaceNameBodyDto(), { name: 'Research Lab' });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects a missing or empty name', () => {
    expect(validateSync(new WorkspaceNameBodyDto()).length).toBeGreaterThan(0);
    const empty = Object.assign(new WorkspaceNameBodyDto(), { name: '' });
    expect(validateSync(empty).length).toBeGreaterThan(0);
  });

  it('rejects a name longer than 80 characters', () => {
    const dto = Object.assign(new WorkspaceNameBodyDto(), { name: 'x'.repeat(81) });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});
