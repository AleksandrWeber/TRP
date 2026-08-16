import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordPage';
import { PasswordForm } from './PasswordPage';
import { ResetPasswordForm } from './ResetPasswordPage';
import {
  CHANGE_PASSWORD_PROMPT,
  FORGOT_PASSWORD_TITLE,
  RECOVERY_ACCEPTED_COPY,
  RECOVERY_UNAVAILABLE_COPY,
  RESET_PASSWORD_TITLE,
} from './passwordRecovery';

describe('password recovery pages (V3-S01-e)', () => {
  it('shows honest unavailable recovery without claiming an email was sent', () => {
    const html = renderToStaticMarkup(
      <ForgotPasswordForm
        email=""
        available={false}
        error={null}
        success={null}
        loading={false}
        onEmailChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(html).toContain(FORGOT_PASSWORD_TITLE);
    expect(html).toContain(RECOVERY_UNAVAILABLE_COPY);
    expect(html).not.toContain('email was sent');
    expect(html).not.toContain('MFA');
    expect(html).not.toContain('OAuth');
  });

  it('shows the generic accepted copy when recovery is available', () => {
    const html = renderToStaticMarkup(
      <ForgotPasswordForm
        email="ada@example.com"
        available={true}
        error={null}
        success={RECOVERY_ACCEPTED_COPY}
        loading={false}
        onEmailChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(html).toContain(RECOVERY_ACCEPTED_COPY);
  });

  it('asks for a new password without exposing a token', () => {
    const html = renderToStaticMarkup(
      <ResetPasswordForm
        password=""
        confirm=""
        error={null}
        loading={false}
        missingToken={false}
        onPasswordChange={() => undefined}
        onConfirmChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(html).toContain(RESET_PASSWORD_TITLE);
    expect(html).not.toContain('token=');
    expect(html).not.toContain('JWT');
  });

  it('confirms password change and does not offer MFA', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PasswordForm
          currentPassword=""
          newPassword=""
          confirm=""
          error={null}
          success={null}
          pending={true}
          busy={false}
          onCurrentChange={() => undefined}
          onNewChange={() => undefined}
          onConfirmChange={() => undefined}
          onCancelPending={() => undefined}
          onSubmit={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain(CHANGE_PASSWORD_PROMPT);
    expect(html).not.toContain('MFA');
    expect(html).not.toContain('passkey');
  });
});
