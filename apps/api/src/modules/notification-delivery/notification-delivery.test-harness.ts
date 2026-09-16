import { Module } from '@nestjs/common';
import type { TestingModuleBuilder } from '@nestjs/testing';
import { SecretVaultModule } from '../secret-vault';
import { SecretVaultService } from '../secret-vault/secret-vault.service';
import { InMemoryEmailAdapter } from './adapters/in-memory-email.adapter';
import { InMemoryDiscordAdapter } from './adapters/in-memory-discord.adapter';
import { InMemorySlackAdapter } from './adapters/in-memory-slack.adapter';
import { InMemoryTeamsAdapter } from './adapters/in-memory-teams.adapter';
import { InMemoryTelegramAdapter } from './adapters/in-memory-telegram.adapter';
import {
  DISCORD_CHANNEL_ADAPTER,
  EMAIL_CHANNEL_ADAPTER,
  SLACK_CHANNEL_ADAPTER,
  TEAMS_CHANNEL_ADAPTER,
  TELEGRAM_CHANNEL_ADAPTER,
} from './ports/notification.port';

/**
 * Isolated compile of NotificationDeliveryModule must not pull Workspace/Auth
 * through SecretVaultModule. Production AppModule already has that graph.
 */
@Module({
  providers: [
    {
      provide: SecretVaultService,
      useValue: Object.freeze({
        retrieve: async () => Object.freeze({}),
      }),
    },
  ],
  exports: [SecretVaultService],
})
export class IsolatedSecretVaultModule {}

export function stubSecretVaultForIsolatedNotificationDelivery(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder.overrideModule(SecretVaultModule).useModule(IsolatedSecretVaultModule);
}

export function bindInMemoryTelegramChannelForTests(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder.overrideProvider(TELEGRAM_CHANNEL_ADAPTER).useFactory({
    factory: (adapter: InMemoryTelegramAdapter) => adapter,
    inject: [InMemoryTelegramAdapter],
  });
}

export function bindInMemoryEmailChannelForTests(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder.overrideProvider(EMAIL_CHANNEL_ADAPTER).useFactory({
    factory: (adapter: InMemoryEmailAdapter) => adapter,
    inject: [InMemoryEmailAdapter],
  });
}

export function bindInMemorySlackChannelForTests(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder.overrideProvider(SLACK_CHANNEL_ADAPTER).useFactory({
    factory: (adapter: InMemorySlackAdapter) => adapter,
    inject: [InMemorySlackAdapter],
  });
}

export function bindInMemoryDiscordChannelForTests(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder.overrideProvider(DISCORD_CHANNEL_ADAPTER).useFactory({
    factory: (adapter: InMemoryDiscordAdapter) => adapter,
    inject: [InMemoryDiscordAdapter],
  });
}

export function bindInMemoryTeamsChannelForTests(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder.overrideProvider(TEAMS_CHANNEL_ADAPTER).useFactory({
    factory: (adapter: InMemoryTeamsAdapter) => adapter,
    inject: [InMemoryTeamsAdapter],
  });
}
