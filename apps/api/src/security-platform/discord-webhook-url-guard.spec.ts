import { describe, expect, it } from 'vitest';
import {
  DISCORD_INCOMING_WEBHOOK_HOSTS,
  validateDiscordIncomingWebhookUrl,
} from './discord-webhook-url-guard';

const VALID = 'https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz';
const VALID_APP =
  'https://discordapp.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz';

function reasonOf(target: string): string | undefined {
  const result = validateDiscordIncomingWebhookUrl(target);
  return result.ok ? undefined : result.reason;
}

describe('Discord Incoming Webhook URL guard', () => {
  it('accepts discord.com and discordapp.com HTTPS webhook paths', () => {
    expect(validateDiscordIncomingWebhookUrl(VALID)).toEqual({
      ok: true,
      url: new URL(VALID),
    });
    expect(validateDiscordIncomingWebhookUrl(VALID_APP).ok).toBe(true);
    expect(DISCORD_INCOMING_WEBHOOK_HOSTS).toEqual(['discord.com', 'discordapp.com']);
  });

  it('rejects HTTP, arbitrary hosts, and non-allowlisted Discord subdomains', () => {
    expect(validateDiscordIncomingWebhookUrl('http://discord.com/api/webhooks/1/token').ok).toBe(
      false,
    );
    expect(reasonOf('https://evil.example/api/webhooks/1/token')).toBe('blocked_host');
    expect(reasonOf('https://ptb.discord.com/api/webhooks/1/token')).toBe('blocked_host');
    expect(reasonOf('https://canary.discord.com/api/webhooks/1/token')).toBe('blocked_host');
    expect(reasonOf('https://cdn.discordapp.com/api/webhooks/1/token')).toBe('blocked_host');
    expect(reasonOf('https://evil.discord.com/api/webhooks/1/token')).toBe('blocked_host');
  });

  it('rejects localhost, private, metadata, userinfo, query, fragment, and bad paths', () => {
    expect(validateDiscordIncomingWebhookUrl('https://localhost/api/webhooks/1/token').ok).toBe(
      false,
    );
    expect(validateDiscordIncomingWebhookUrl('https://127.0.0.1/api/webhooks/1/token').ok).toBe(
      false,
    );
    expect(validateDiscordIncomingWebhookUrl('https://10.0.0.8/api/webhooks/1/token').ok).toBe(
      false,
    );
    expect(validateDiscordIncomingWebhookUrl('https://169.254.169.254/latest').ok).toBe(false);
    expect(reasonOf('https://user:pass@discord.com/api/webhooks/1/token')).toBe('userinfo');
    expect(reasonOf(`${VALID}?wait=true`)).toBe('query');
    expect(reasonOf(`${VALID}#frag`)).toBe('fragment');
    expect(reasonOf('https://discord.com/api/webhooks/')).toBe('blocked_path');
    expect(reasonOf('https://discord.com/api/webhooks/abc/token')).toBe('blocked_path');
    expect(reasonOf('https://discord.com/api/webhooks/1/token/extra')).toBe('blocked_path');
    expect(reasonOf('https://discord.com/api/webhooks/../1/token')).toBe('blocked_path');
  });
});
