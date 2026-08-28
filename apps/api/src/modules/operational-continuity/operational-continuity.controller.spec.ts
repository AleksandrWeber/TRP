import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationalContinuityController } from './operational-continuity.controller';
import { OperationalContinuityService } from './operational-continuity.service';
import type { PlatformOperationalProjection } from './operational-readiness';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';

describe('OperationalContinuityController', () => {
  const projection: PlatformOperationalProjection = Object.freeze({
    platformState: 'Ready',
    ownerStates: Object.freeze([]),
    unavailableOwners: Object.freeze([]),
    degradedOwners: Object.freeze([]),
    recoveryTimestamp: '2026-08-26T00:00:00.000Z',
    recoveryDurationMs: 5,
    notificationQueue: null,
    killSwitch: null,
    monitoringHealth: null,
    exchangeConnectivity: null,
    bybitExchangeConnectivity: null,
    okxExchangeConnectivity: null,
  });

  let continuity: OperationalContinuityService;
  let access: WorkspaceAccessService;
  let controller: OperationalContinuityController;

  beforeEach(() => {
    continuity = {
      getProjection: vi.fn(() => projection),
    } as unknown as OperationalContinuityService;
    access = {
      assertMember: vi.fn(),
    } as unknown as WorkspaceAccessService;
    controller = new OperationalContinuityController(continuity, access);
  });

  it('returns readiness projection for workspace member', () => {
    const result = controller.readiness({ user: { userId: 'u1' } as never }, 'ws-1');
    expect(result.platformState).toBe('Ready');
    expect(access.assertMember).toHaveBeenCalledWith('ws-1', 'u1');
  });

  it('requires workspace header', () => {
    expect(() => controller.readiness({ user: { userId: 'u1' } as never }, undefined)).toThrow(
      BadRequestException,
    );
  });

  it('denies non-members', () => {
    (access.assertMember as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => controller.readiness({ user: { userId: 'u1' } as never }, 'ws-1')).toThrow(
      ForbiddenException,
    );
  });
});
