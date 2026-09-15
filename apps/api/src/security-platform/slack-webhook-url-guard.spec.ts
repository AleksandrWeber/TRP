import { describe, expect, it } from 'vitest';
import {
  SLACK_INCOMING_WEBHOOK_HOST,
  validateSlackIncomingWebhookUrl,
} from './slack-webhook-url-guard';

const VALID = 'https://hooks.slack.com/services/TEAM/HOOK/TOKEN';
const VALID_LEGACY = 'https://hooks.slack.com/TEAM/HOOK/TOKEN';

function reasonOf(target: string): string | undefined {
  const result = validateSlackIncomingWebhookUrl(target);
  return result.ok ? undefined : result.reason;
}

describe('Slack Incoming Webhook URL guard', () => {
  it('accepts canonical and legacy hooks.slack.com HTTPS paths', () => {
    expect(validateSlackIncomingWebhookUrl(VALID)).toEqual({
      ok: true,
      url: new URL(VALID),
    });
    expect(validateSlackIncomingWebhookUrl(VALID_LEGACY).ok).toBe(true);
    expect(SLACK_INCOMING_WEBHOOK_HOST).toBe('hooks.slack.com');
  });

  it('rejects HTTP, arbitrary hosts, localhost, private, and metadata', () => {
    expect(validateSlackIncomingWebhookUrl('http://hooks.slack.com/services/T/B/X').ok).toBe(false);
    expect(reasonOf('https://evil.example/services/T/B/X')).toBe('blocked_host');
    expect(validateSlackIncomingWebhookUrl('https://localhost/services/T/B/X').ok).toBe(false);
    expect(validateSlackIncomingWebhookUrl('https://127.0.0.1/services/T/B/X').ok).toBe(false);
    expect(validateSlackIncomingWebhookUrl('https://10.0.0.8/services/T/B/X').ok).toBe(false);
    expect(validateSlackIncomingWebhookUrl('https://169.254.169.254/latest').ok).toBe(false);
  });

  it('rejects userinfo, query, fragment, and malformed paths', () => {
    expect(reasonOf('https://user:pass@hooks.slack.com/services/T/B/X')).toBe('userinfo');
    expect(reasonOf(`${VALID}?x=1`)).toBe('query');
    expect(reasonOf(`${VALID}#frag`)).toBe('fragment');
    expect(reasonOf('https://hooks.slack.com/services/')).toBe('blocked_path');
    expect(reasonOf('https://hooks.slack.com/')).toBe('blocked_path');
  });
});
