import type { ConfigService } from '@nestjs/config';
import { UnconfiguredHostMail, type HostMailPort } from './host-mail';
import { SmtpHostMail } from './host-mail.smtp';

export function createHostMail(config: ConfigService): HostMailPort {
  const host = config.get<string>('MAIL_HOST')?.trim();
  if (!host) {
    return new UnconfiguredHostMail();
  }

  const port = Number(config.get<string>('MAIL_PORT') ?? 587);
  return new SmtpHostMail({
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    from: config.get<string>('MAIL_FROM')?.trim() || 'noreply@localhost',
    user: config.get<string>('MAIL_USER')?.trim() || undefined,
    pass: config.get<string>('MAIL_PASSWORD')?.trim() || undefined,
  });
}

export function publicAppOrigin(config: ConfigService): string {
  const explicit = config.get<string>('PUBLIC_APP_URL')?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const cors = config.get<string>('CORS_ORIGIN')?.split(',')[0]?.trim();
  return (cors || 'http://localhost:5173').replace(/\/$/, '');
}
