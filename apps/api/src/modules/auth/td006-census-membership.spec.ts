import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenRouterAiRequestController } from '../ai-connectivity/openrouter-ai-request.controller';
import { WorkspaceAiRequestHistoryController } from '../ai-connectivity/workspace-ai-request-history.controller';
import { WorkspaceAiSessionController } from '../ai-connectivity/workspace-ai-session.controller';
import { DiscordController } from '../discord-product/discord.controller';
import { EmailController } from '../email-product/email.controller';
import type { AuthUser } from './jwt.strategy';
import { Role } from '../identity/role';
import { PushController } from '../push-product/push.controller';
import { SecurityAuditTimelineController } from '../security-audit/security-audit-timeline.controller';
import { SlackController } from '../slack-product/slack.controller';
import { TeamsController } from '../teams-product/teams.controller';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';

function request(userId: string, role: Role = Role.Trader): { user: AuthUser } {
  return { user: { userId, email: `${userId}@trp.local`, displayName: userId, role } };
}

async function settle(run: () => unknown): Promise<unknown> {
  return await run();
}

describe('TD-006 census controller membership', () => {
  let access: WorkspaceAccessService;
  let workspaceId: string;

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    workspaceId = (await workspaces.create({ name: 'One', ownerUserId: 'owner' })).id;
    access = new WorkspaceAccessService(workspaces);
  });

  const owner = () => request('owner');
  const adminStranger = () => request('stranger', Role.Admin);

  async function denies(
    call: (actor: { user: AuthUser }, workspace: string) => unknown,
    spies: ReadonlyArray<{ mockClear: () => void; mock: { calls: unknown[] } }>,
  ) {
    for (const spy of spies) spy.mockClear();
    await expect(settle(() => call(adminStranger(), workspaceId))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(settle(() => call(request('stranger'), workspaceId))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    for (const spy of spies) expect(spy.mock.calls).toHaveLength(0);
  }

  it('denies non-owners on every Push route before the product service', async () => {
    const product = {
      getConnection: vi.fn(() => ({ bound: false })),
      bind: vi.fn(async () => ({ bound: true })),
      getVapidPublicKey: vi.fn(async () => ({ publicKey: 'k' })),
      registerSubscription: vi.fn(async () => ({ id: 'sub' })),
      revokeSubscription: vi.fn(async () => ({ id: 'sub' })),
      sendTest: vi.fn(async () => ({ delivered: true })),
      disconnect: vi.fn(async () => ({ bound: false })),
      getDiagnostics: vi.fn(() => ({})),
    };
    const controller = new PushController(product as never, access);
    const spies = Object.values(product);
    await denies((actor, id) => controller.status(actor, id), spies);
    await denies((actor, id) => controller.bind(actor, id), spies);
    await denies((actor, id) => controller.vapidPublicKey(actor, id), spies);
    await denies((actor, id) => controller.registerSubscription(actor, id, 'agent', {}), spies);
    await denies((actor, id) => controller.revokeSubscription(actor, id, 'sub'), spies);
    await denies((actor, id) => controller.sendTest(actor, id), spies);
    await denies((actor, id) => controller.disconnect(actor, id), spies);
    await denies((actor, id) => controller.diagnostics(actor, id), spies);
    expect(controller.status(owner(), workspaceId)).toEqual({ bound: false });
    expect(product.getConnection).toHaveBeenCalledOnce();
  });

  it.each([
    ['Teams', TeamsController],
    ['Discord', DiscordController],
    ['Slack', SlackController],
  ] as const)('denies non-owners on every %s route', async (_name, ControllerType) => {
    const product = {
      getConnection: vi.fn(() => ({ bound: false })),
      bind: vi.fn(async () => ({ bound: true })),
      sendTest: vi.fn(async () => ({ delivered: true })),
      disconnect: vi.fn(() => ({ bound: false })),
      getDiagnostics: vi.fn(() => ({})),
    };
    const controller = new ControllerType(product as never, access);
    const spies = Object.values(product);
    await denies((actor, id) => controller.status(actor, id), spies);
    await denies((actor, id) => controller.bind(actor, id), spies);
    await denies((actor, id) => controller.sendTest(actor, id), spies);
    await denies((actor, id) => controller.disconnect(actor, id), spies);
    await denies((actor, id) => controller.diagnostics(actor, id), spies);
    expect(controller.status(owner(), workspaceId)).toEqual({ bound: false });
  });

  it('denies non-owners on every Email route', async () => {
    const product = {
      getConnection: vi.fn(() => ({ bound: false })),
      bind: vi.fn(() => ({ bound: true })),
      sendTest: vi.fn(async () => ({ delivered: true })),
      disconnect: vi.fn(() => ({ bound: false })),
      getDiagnostics: vi.fn(() => ({})),
    };
    const controller = new EmailController(product as never, access);
    const spies = Object.values(product);
    await denies((actor, id) => controller.status(actor, id), spies);
    await denies(
      (actor, id) => controller.bind(actor, id, { recipient: 'a@trp.local' } as never),
      spies,
    );
    await denies((actor, id) => controller.sendTest(actor, id), spies);
    await denies((actor, id) => controller.disconnect(actor, id), spies);
    await denies((actor, id) => controller.diagnostics(actor, id), spies);
    expect(controller.status(owner(), workspaceId)).toEqual({ bound: false });
  });

  it('denies non-owners on AI request routes', async () => {
    const requests = {
      lastResult: vi.fn(() => ({ status: 'NONE' as const })),
      execute: vi.fn(async () => ({ id: 'req-1' })),
    };
    const controller = new OpenRouterAiRequestController(requests as never, access);
    const spies = Object.values(requests);
    await denies((actor, id) => controller.lastRequest(actor, id, 'conn'), spies);
    await denies(
      (actor, id) => controller.execute(actor, id, 'conn', { prompt: 'hi' } as never),
      spies,
    );
    expect(controller.lastRequest(owner(), workspaceId, 'conn')).toEqual({ status: 'NONE' });
  });

  it('denies non-owners on AI session routes', async () => {
    const sessions = {
      list: vi.fn(async () => []),
      get: vi.fn(async () => ({ id: 's' })),
      create: vi.fn(async () => ({ id: 's' })),
      rename: vi.fn(async () => ({ id: 's' })),
      close: vi.fn(async () => ({ id: 's' })),
    };
    const controller = new WorkspaceAiSessionController(sessions as never, access);
    const spies = Object.values(sessions);
    await denies((actor, id) => controller.list(actor, id), spies);
    await denies((actor, id) => controller.get(actor, id, 's'), spies);
    await denies((actor, id) => controller.create(actor, id, { displayName: 'A' } as never), spies);
    await denies(
      (actor, id) => controller.rename(actor, id, 's', { displayName: 'B' } as never),
      spies,
    );
    await denies((actor, id) => controller.close(actor, id, 's'), spies);
    await expect(controller.list(owner(), workspaceId)).resolves.toEqual([]);
    expect(sessions.list).toHaveBeenCalledOnce();
  });

  it('denies non-owners on AI request history routes', async () => {
    const history = {
      list: vi.fn(async () => []),
      get: vi.fn(async () => ({ id: 'h' })),
    };
    const controller = new WorkspaceAiRequestHistoryController(history as never, access);
    const spies = Object.values(history);
    await denies((actor, id) => controller.list(actor, id), spies);
    await denies((actor, id) => controller.get(actor, id, 'h'), spies);
    await expect(controller.list(owner(), workspaceId)).resolves.toEqual([]);
  });

  it('denies a non-owner Admin before reading the security audit timeline', async () => {
    const timeline = { readWorkspaceTimeline: vi.fn(async () => ({ items: [] })) };
    const controller = new SecurityAuditTimelineController(timeline as never, access);
    await expect(controller.read(adminStranger(), workspaceId, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(timeline.readWorkspaceTimeline).not.toHaveBeenCalled();
    await expect(controller.read(owner(), workspaceId, {})).resolves.toEqual({ items: [] });
    expect(timeline.readWorkspaceTimeline).toHaveBeenCalledOnce();
  });
});
