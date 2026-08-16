/**
 * Host transactional mail port for Auth recovery (V3-S01-e).
 * Infrastructure, like DATABASE_URL and JWT signing.
 * Not Notification Delivery, not Telegram, not a customer vault secret.
 */

export const HOST_MAIL = Symbol('HOST_MAIL');

export type PasswordResetMail = {
  to: string;
  resetUrl: string;
};

export interface HostMailPort {
  isConfigured(): boolean;
  sendPasswordReset(message: PasswordResetMail): Promise<void>;
}

export class UnconfiguredHostMail implements HostMailPort {
  isConfigured(): boolean {
    return false;
  }

  async sendPasswordReset(): Promise<void> {
    throw new Error('Host mail is not configured');
  }
}

export class CapturingHostMail implements HostMailPort {
  readonly messages: PasswordResetMail[] = [];

  constructor(private readonly configured: boolean) {}

  isConfigured(): boolean {
    return this.configured;
  }

  async sendPasswordReset(message: PasswordResetMail): Promise<void> {
    if (!this.configured) {
      throw new Error('Host mail is not configured');
    }
    this.messages.push({ ...message });
  }
}
