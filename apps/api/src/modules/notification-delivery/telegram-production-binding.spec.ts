import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { ProductionTelegramBotApiAdapter } from './adapters/telegram-bot-api.adapter';
import { NotificationDeliveryModule } from './notification-delivery.module';
import { stubSecretVaultForIsolatedNotificationDelivery } from './notification-delivery.test-harness';
import { TELEGRAM_CHANNEL_ADAPTER } from './ports/notification.port';

describe('REM-01-s2 production Telegram binding', () => {
  it('binds TELEGRAM_CHANNEL_ADAPTER to ProductionTelegramBotApiAdapter', async () => {
    const moduleRef = await stubSecretVaultForIsolatedNotificationDelivery(
      Test.createTestingModule({
        imports: [NotificationDeliveryModule],
      }),
    ).compile();
    const adapter = moduleRef.get(TELEGRAM_CHANNEL_ADAPTER);
    expect(adapter).toBeInstanceOf(ProductionTelegramBotApiAdapter);
    await moduleRef.close();
  });
});
