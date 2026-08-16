import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../shared/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    bootstrapWorkspace: vi.fn(),
  },
}));

import { PRODUCT_PASSWORD_POLICY_HINT } from '../shared/passwordPolicy';
import { AuthCredentialsForm, LoginPage } from './LoginPage';

describe('LoginPage (PC-18, V3-S01-a)', () => {
  it('renders a professional sign-in form without developer credentials', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('Sign in');
    expect(html).toContain('Sign in to the paper-first operator. Live trading is not offered.');
    expect(html).toContain('Need an account?');
    expect(html).toContain('Forgot password?');
    expect(html).toContain('href="/forgot-password"');
    expect(html).toContain('Create one');
    expect(html).not.toContain('admin@trp.local');
    expect(html).not.toContain('trp-admin-change-me');
    expect(html).not.toContain('JWT');
    expect(html).not.toContain('value="admin');
    expect(html).not.toContain('debug');
  });

  it('shows the password policy in operator language on create-account', () => {
    const html = renderToStaticMarkup(
      <AuthCredentialsForm mode="register" onSwitchMode={() => undefined} />,
    );

    expect(html).toContain('Create account');
    expect(html).toContain(PRODUCT_PASSWORD_POLICY_HINT);
    expect(html).not.toContain('admin@trp.local');
    expect(html).not.toContain('trp-admin-change-me');
    expect(html).not.toContain('JWT');
    expect(html).not.toContain('MFA');
  });
});
