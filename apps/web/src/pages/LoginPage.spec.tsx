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

import { LoginPage } from './LoginPage';

describe('LoginPage (PC-18)', () => {
  it('renders a professional sign-in form without developer credentials', () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain('Sign in');
    expect(html).toContain('Sign in to the paper-first operator. Live trading is not offered.');
    expect(html).toContain('Need an account?');
    expect(html).toContain('Create one');
    expect(html).not.toContain('admin@trp.local');
    expect(html).not.toContain('trp-admin-change-me');
    expect(html).not.toContain('JWT');
    expect(html).not.toContain('value="admin');
    expect(html).not.toContain('debug');
  });
});
