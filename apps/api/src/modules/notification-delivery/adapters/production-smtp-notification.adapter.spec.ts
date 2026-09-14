import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { LogContext, Logger } from '../../../logging/logger';
import { Role } from '../../identity/role';
import { ProductionSmtpNotificationAdapter } from './production-smtp-notification.adapter';
import type {
  SmtpMailTransport,
  SmtpTransportFactory,
} from './production-smtp-notification.adapter';
import type { SmtpCredentialResolver } from './smtp-credential.resolver';

const PASSWORD = 'smtp-adapter-secret-password';
const ADAPTER_SOURCE = readFileSync(
  join(__dirname, 'production-smtp-notification.adapter.ts'),
  'utf8',
);

const CREDENTIAL = {
  host: 'smtp.example.com',
  port: '587',
  username: 'mailer',
  password: PASSWORD,
  sender: 'alerts@example.com',
};

class RecordingLogger implements Logger {
  readonly lines: string[] = [];

  child(): Logger {
    return this;
  }

  debug(message: string, context?: LogContext): void {
    this.capture('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.capture('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.capture('warn', message, context);
  }

  error(message: string, context?: LogContext, error?: unknown): void {
    this.capture('error', message, context, error);
  }

  private capture(level: string, message: string, context?: LogContext, error?: unknown): void {
    this.lines.push(JSON.stringify({ level, message, context, error }));
  }
}

function resolverOk(): SmtpCredentialResolver {
  return {
    resolve: vi.fn(async () => ({ ok: true as const, credential: CREDENTIAL })),
  } as never;
}

function transport(sendMail: SmtpMailTransport['sendMail']): SmtpTransportFactory {
  return () => ({ sendMail, close: vi.fn() });
}

describe('ProductionSmtpNotificationAdapter', () => {
  it('succeeds sendMail through the injected transporter and does not cache credentials', async () => {
    const sendMail = vi.fn(async () => ({ messageId: '1' }));
    const adapter = new ProductionSmtpNotificationAdapter(
      resolverOk(),
      new RecordingLogger(),
      transport(sendMail),
    );
    const result = await adapter.send({
      chatId: 'ops@example.com',
      subject: 'Test notification',
      body: 'Delivery only',
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({ ok: true });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'alerts@example.com',
        to: 'ops@example.com',
      }),
    );
    expect(JSON.stringify(result)).not.toContain(PASSWORD);
  });

  it('blocks private SMTP hosts before opening a transport', async () => {
    const sendMail = vi.fn();
    const adapter = new ProductionSmtpNotificationAdapter(
      {
        resolve: vi.fn(async () => ({
          ok: true as const,
          credential: { ...CREDENTIAL, host: '127.0.0.1' },
        })),
      } as never,
      new RecordingLogger(),
      transport(sendMail),
    );
    const result = await adapter.send({
      chatId: 'ops@example.com',
      subject: 'Test',
      body: 'Body',
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({ ok: false, detail: 'smtp_blocked_host' });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('rejects plaintext port 25', async () => {
    const sendMail = vi.fn();
    const adapter = new ProductionSmtpNotificationAdapter(
      {
        resolve: vi.fn(async () => ({
          ok: true as const,
          credential: { ...CREDENTIAL, port: '25' },
        })),
      } as never,
      new RecordingLogger(),
      transport(sendMail),
    );
    await expect(
      adapter.send({
        chatId: 'ops@example.com',
        subject: 'Test',
        body: 'Body',
        workspaceId: 'workspace-a',
        actorUserId: 'user-a',
        actorRole: Role.Admin,
      }),
    ).resolves.toEqual({ ok: false, detail: 'smtp_tls_required' });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('maps AUTH failure without logging the password', async () => {
    const logger = new RecordingLogger();
    const adapter = new ProductionSmtpNotificationAdapter(
      resolverOk(),
      logger,
      transport(async () => {
        const error = Object.assign(new Error(`Invalid login for ${PASSWORD}`), {
          responseCode: 535,
        });
        throw error;
      }),
    );
    const result = await adapter.send({
      chatId: 'ops@example.com',
      subject: 'Test',
      body: 'Body',
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({ ok: false, detail: 'smtp_unauthorized' });
    expect(JSON.stringify(result)).not.toContain(PASSWORD);
    expect(logger.lines.join('\n')).not.toContain(PASSWORD);
  });

  it('does not import Auth host-mail', () => {
    expect(ADAPTER_SOURCE).not.toContain('host-mail.smtp');
    expect(ADAPTER_SOURCE).not.toContain('SmtpHostMail');
    expect(ADAPTER_SOURCE).not.toContain('MAIL_HOST');
  });
});
