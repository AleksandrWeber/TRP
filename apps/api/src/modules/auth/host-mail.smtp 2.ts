import { createTransport } from 'nodemailer';
import type { HostMailPort, PasswordResetMail } from './host-mail';

export type SmtpHostMailOptions = {
  host: string;
  port: number;
  from: string;
  user?: string;
  pass?: string;
};

/**
 * Host SMTP adapter for Auth recovery mail (V3-S01-e).
 * Not a Notification channel. Not a customer-configured product SMTP form.
 */
export class SmtpHostMail implements HostMailPort {
  constructor(private readonly options: SmtpHostMailOptions) {}

  isConfigured(): boolean {
    return true;
  }

  async sendPasswordReset(message: PasswordResetMail): Promise<void> {
    const transport = createTransport({
      host: this.options.host,
      port: this.options.port,
      secure: this.options.port === 465,
      auth:
        this.options.user && this.options.pass
          ? { user: this.options.user, pass: this.options.pass }
          : undefined,
    });
    await transport.sendMail({
      from: this.options.from,
      to: message.to,
      subject: 'Reset your TRP password',
      text: [
        'Use this link to choose a new password. It expires in one hour and can be used once.',
        '',
        message.resetUrl,
        '',
        'If you did not ask to reset your password, you can ignore this message.',
      ].join('\n'),
    });
  }
}
