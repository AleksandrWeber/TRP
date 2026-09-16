import { describe, expect, it } from 'vitest';
import {
  TEAMS_WEBHOOK_HOST_REGEX,
  validateTeamsIncomingWebhookUrl,
} from './teams-webhook-url-guard';

/** Synthetic fixture — not a live credential. */
const QUERY = 'api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=TESTSIG_NOT_A_REAL_SECRET';
const HOST = 'defaultenv.e1.environment.api.powerplatform.com';
const FORM_A_PATH =
  '/powerautomate/automations/direct/workflows/wfid123/triggers/manual/paths/invoke';
const FORM_B_PATH =
  '/powerautomate/automations/direct/cu/0/workflows/wfid123/triggers/manual/paths/invoke';

const VALID_A = `https://${HOST}${FORM_A_PATH}?${QUERY}`;
const VALID_B = `https://${HOST}${FORM_B_PATH}?${QUERY}`;
const VALID_A_SLASH = `https://${HOST}${FORM_A_PATH}/?${QUERY}`;

function reasonOf(target: string): string | undefined {
  const result = validateTeamsIncomingWebhookUrl(target);
  return result.ok ? undefined : result.reason;
}

describe('Teams Incoming Webhook URL guard', () => {
  it('accepts Form A and Form B HTTPS Workflows invoke URLs', () => {
    const a = validateTeamsIncomingWebhookUrl(VALID_A);
    expect(a.ok).toBe(true);
    if (a.ok) {
      expect(a.preservedUrl).toBe(VALID_A);
    }
    expect(validateTeamsIncomingWebhookUrl(VALID_B).ok).toBe(true);
    expect(validateTeamsIncomingWebhookUrl(VALID_A_SLASH).ok).toBe(true);
    expect(TEAMS_WEBHOOK_HOST_REGEX.test(HOST)).toBe(true);
  });

  it('preserves exact query string without reordering', () => {
    const shuffled = `https://${HOST}${FORM_A_PATH}?sig=TESTSIG_NOT_A_REAL_SECRET&sv=1.0&sp=%2Ftriggers%2Fmanual%2Frun&api-version=1`;
    const result = validateTeamsIncomingWebhookUrl(shuffled);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.preservedUrl).toBe(shuffled);
      expect(result.preservedUrl).toContain('sig=TESTSIG_NOT_A_REAL_SECRET&sv=1.0');
    }
  });

  it('rejects invalid hosts including logic.azure.com and webhook.office.com', () => {
    expect(reasonOf(`https://logic.azure.com${FORM_A_PATH}?${QUERY}`)).toBe('blocked_host');
    expect(reasonOf(`https://prod.westus.logic.azure.com${FORM_A_PATH}?${QUERY}`)).toBe(
      'blocked_host',
    );
    expect(reasonOf(`https://outlook.office.com/webhook/x?${QUERY}`)).toBe('blocked_host');
    expect(reasonOf(`https://company.webhook.office.com/webhookb2/x?${QUERY}`)).toBe(
      'blocked_host',
    );
    expect(reasonOf(`https://evil.example${FORM_A_PATH}?${QUERY}`)).toBe('blocked_host');
    expect(reasonOf(`https://a.b.c.environment.api.powerplatform.com${FORM_A_PATH}?${QUERY}`)).toBe(
      'blocked_host',
    );
  });

  it('rejects HTTP, IP literals, localhost, private, and metadata destinations', () => {
    expect(reasonOf(`http://${HOST}${FORM_A_PATH}?${QUERY}`)).toBe('blocked_scheme');
    expect(validateTeamsIncomingWebhookUrl(`https://127.0.0.1${FORM_A_PATH}?${QUERY}`).ok).toBe(
      false,
    );
    expect(validateTeamsIncomingWebhookUrl(`https://10.0.0.8${FORM_A_PATH}?${QUERY}`).ok).toBe(
      false,
    );
    expect(validateTeamsIncomingWebhookUrl(`https://192.168.1.1${FORM_A_PATH}?${QUERY}`).ok).toBe(
      false,
    );
    expect(validateTeamsIncomingWebhookUrl(`https://localhost${FORM_A_PATH}?${QUERY}`).ok).toBe(
      false,
    );
    expect(validateTeamsIncomingWebhookUrl('https://169.254.169.254/latest').ok).toBe(false);
  });

  it('rejects userinfo, fragment, bad paths, and non-invoke paths', () => {
    expect(reasonOf(`https://user:pass@${HOST}${FORM_A_PATH}?${QUERY}`)).toBe('userinfo');
    expect(reasonOf(`${VALID_A}#frag`)).toBe('fragment');
    expect(reasonOf(`https://${HOST}/wrong/path?${QUERY}`)).toBe('blocked_path');
    expect(
      reasonOf(
        `https://${HOST}/powerautomate/automations/direct/workflows/wfid123/triggers/manual/paths/invoke/extra?${QUERY}`,
      ),
    ).toBe('blocked_path');
  });

  it('rejects invalid query contracts', () => {
    expect(reasonOf(`https://${HOST}${FORM_A_PATH}`)).toBe('query');
    expect(reasonOf(`https://${HOST}${FORM_A_PATH}?sp=x&sv=1.0&sig=y`)).toBe('query'); // missing api-version
    expect(reasonOf(`https://${HOST}${FORM_A_PATH}?api-version=1&sv=1.0&sig=y`)).toBe('query'); // missing sp
    expect(reasonOf(`https://${HOST}${FORM_A_PATH}?api-version=1&sp=x&sig=y`)).toBe('query'); // missing sv
    expect(reasonOf(`https://${HOST}${FORM_A_PATH}?api-version=1&sp=x&sv=1.0`)).toBe('query'); // missing sig
    expect(
      reasonOf(`https://${HOST}${FORM_A_PATH}?api-version=1&sp=x&sv=1.0&sig=y&tenantId=t`),
    ).toBe('query'); // unknown
    expect(reasonOf(`https://${HOST}${FORM_A_PATH}?api-version=1&sp=x&sv=1.0&sig=y&sig=z`)).toBe(
      'query',
    ); // duplicate
    expect(reasonOf(`https://${HOST}${FORM_A_PATH}?api-version=1&sp=x&sv=1.0&sig=`)).toBe('query'); // empty
  });
});
