import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryNotificationStore } from './adapters/in-memory-notification-store';
import { InMemoryTelegramAdapter } from './adapters/in-memory-telegram.adapter';
import { TelegramBotApiHttpClient } from './adapters/telegram-bot-api.http';
import { TelegramStartBindObserver } from './adapters/telegram-start-bind.observer';
import { NotificationDeliveryService } from './notification-delivery.service';

const BOT_TOKEN = '123456:REM02-MOCK-TOKEN';
const ACTOR = Object.freeze({
  actorUserId: 'user-a',
  actorRole: Role.Trader,
});

function mockedObserver(resultBody: unknown) {
  return new TelegramStartBindObserver(
    new TelegramBotApiHttpClient(async (url) => {
      expect(url).toContain('/getUpdates');
      expect(url).toContain('timeout=0');
      expect(url).not.toContain('setWebhook');
      return { status: 200, text: async () => JSON.stringify(resultBody) };
    }),
    { resolve: async () => ({ ok: true as const, botToken: BOT_TOKEN }) } as never,
  );
}

describe('REM-02 real Telegram chat binding (MOCKED / DETERMINISTIC)', () => {
  it('binds numeric chat.id from a mocked /start update onto TelegramConnection', async () => {
    const store = new InMemoryNotificationStore();
    const bootstrap = new NotificationDeliveryService(store, new InMemoryTelegramAdapter());
    const connect = bootstrap.connectTelegram({
      workspaceId: 'ws-a',
      userId: 'user-a',
      requestedAt: '2026-09-14T12:00:00.000Z',
    });
    const token = connect.connection.connectionToken!;
    const boundService = new NotificationDeliveryService(
      store,
      new InMemoryTelegramAdapter(),
      mockedObserver({
        ok: true,
        result: [{ update_id: 11, message: { chat: { id: 777001 }, text: `/start ${token}` } }],
      }),
    );

    const connected = await boundService.observePendingTelegramBind({
      workspaceId: 'ws-a',
      userId: 'user-a',
      ...ACTOR,
    });

    expect(connected.status).toBe('connected');
    expect(connected.chatId).toBe('777001');
    expect(connected.workspaceId).toBe('ws-a');
    expect(connected.userId).toBe('user-a');
    expect(connected.chatId).not.toMatch(/^in-memory:/);
    expect(store.getTelegram('ws-a', 'user-a')?.chatId).toBe('777001');

    const snapshot = store.exportDurableState();
    const restored = new InMemoryNotificationStore();
    restored.importDurableState(snapshot);
    expect(restored.getTelegram('ws-a', 'user-a')?.chatId).toBe('777001');
  });

  it('does not bind workspace B from a token that belongs to workspace A', async () => {
    const store = new InMemoryNotificationStore();
    const first = new NotificationDeliveryService(store, new InMemoryTelegramAdapter());
    const connectA = first.connectTelegram({
      workspaceId: 'ws-a',
      userId: 'user-a',
      requestedAt: '2026-09-14T12:00:00.000Z',
    });
    first.connectTelegram({
      workspaceId: 'ws-b',
      userId: 'user-b',
      requestedAt: '2026-09-14T12:01:00.000Z',
    });
    const tokenA = connectA.connection.connectionToken!;
    const service = new NotificationDeliveryService(
      store,
      new InMemoryTelegramAdapter(),
      mockedObserver({
        ok: true,
        result: [{ update_id: 1, message: { chat: { id: 99 }, text: `/start ${tokenA}` } }],
      }),
    );

    await expect(
      service.observePendingTelegramBind({
        workspaceId: 'ws-b',
        userId: 'user-b',
        actorUserId: 'user-b',
        actorRole: Role.Trader,
      }),
    ).rejects.toThrow('Telegram chat has not been observed');
    expect(store.getTelegram('ws-b', 'user-b')?.status).toBe('pending');
    expect(store.getTelegram('ws-a', 'user-a')?.chatId).toBeUndefined();
    expect(store.getTelegram('ws-b', 'user-b')?.chatId).toBeUndefined();
  });

  it('fails closed when getUpdates is missing, unmatched, or already bound', async () => {
    const store = new InMemoryNotificationStore();
    const service = new NotificationDeliveryService(
      store,
      new InMemoryTelegramAdapter(),
      mockedObserver({ ok: true, result: [] }),
    );
    await expect(
      service.observePendingTelegramBind({
        workspaceId: 'ws-a',
        userId: 'user-a',
        ...ACTOR,
      }),
    ).rejects.toThrow('Telegram connection is not awaiting bind');

    service.connectTelegram({
      workspaceId: 'ws-a',
      userId: 'user-a',
      requestedAt: '2026-09-14T12:00:00.000Z',
    });
    await expect(
      service.observePendingTelegramBind({
        workspaceId: 'ws-a',
        userId: 'user-a',
        ...ACTOR,
      }),
    ).rejects.toThrow('Telegram chat has not been observed');

    service.completeTelegramConnect({
      connectionToken: store.getTelegram('ws-a', 'user-a')!.connectionToken!,
      chatId: '1',
    });
    await expect(
      service.observePendingTelegramBind({
        workspaceId: 'ws-a',
        userId: 'user-a',
        ...ACTOR,
      }),
    ).rejects.toThrow('Telegram connection is not awaiting bind');
  });
});
