import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { PeopleOperatorView } from '../shared/api';
import { PeoplePanel } from './PeoplePage';
import {
  LAST_ADMIN_MESSAGE,
  PEOPLE_CHANGE_LABEL,
  PEOPLE_CONFIRM_LABEL,
  PEOPLE_FORBIDDEN,
  PEOPLE_FORBIDDEN_TITLE,
  PEOPLE_OWN_ROLE_NOTE,
  PEOPLE_PAGE_DESCRIPTION,
  PEOPLE_PAGE_TITLE,
  PEOPLE_YOU_LABEL,
  confirmRoleChangePrompt,
  isPeopleRole,
  roleLabel,
} from './peopleProduct';

const operators: PeopleOperatorView[] = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    displayName: 'Ada Admin',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: 'op-2',
    email: 'reader@example.com',
    displayName: 'Riley Reader',
    role: 'Reader',
    status: 'Active',
  },
];

function renderPanel(extra?: Partial<Parameters<typeof PeoplePanel>[0]>) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <PeoplePanel
        operators={operators}
        currentUserId="admin-1"
        loading={false}
        forbidden={false}
        busy={false}
        error={null}
        success={null}
        pending={null}
        drafts={{ 'admin-1': 'Admin', 'op-2': 'Reader' }}
        onDraft={() => undefined}
        onAsk={() => undefined}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        {...extra}
      />
    </MemoryRouter>,
  );
}

describe('PeoplePage (V3-S02-d)', () => {
  it('lists people, current roles, and the signed-in administrator', () => {
    const html = renderPanel();

    expect(html).toContain(PEOPLE_PAGE_TITLE);
    expect(html).toContain(PEOPLE_PAGE_DESCRIPTION);
    expect(html).toContain('Ada Admin');
    expect(html).toContain('Riley Reader');
    expect(html).toContain('Current role: Administrator');
    expect(html).toContain('Current role: Reader');
    expect(html).toContain(PEOPLE_YOU_LABEL);
    expect(html).toContain(PEOPLE_CHANGE_LABEL);
    expect(html).toContain('data-testid="people-current"');
    expect(html).toContain('id="role-admin-1"');
    expect(html).toContain(roleLabel('Trader'));
    expect(html).not.toContain(PEOPLE_OWN_ROLE_NOTE);
    expect(html).not.toContain('Invite');
    expect(html).not.toContain('Vault');
    expect(html).not.toContain('API key');
    expect(html).not.toContain('Billing');
    expect(html).not.toContain('Live trading');
    expect(html).not.toContain('JWT');
    expect(html).not.toContain('Prisma');
  });

  it("asks for confirmation before changing another person's role", () => {
    const html = renderPanel({ pending: { userId: 'op-2', role: 'Trader' } });
    expect(html).toContain(confirmRoleChangePrompt('Riley Reader', 'Trader'));
    expect(html).toContain(PEOPLE_CONFIRM_LABEL);
    expect(html).toContain('Cancel');
  });

  it('lets an Administrator try to change their own role, then shows a clear refusal', () => {
    const asking = renderPanel({ pending: { userId: 'admin-1', role: 'Trader' } });
    expect(asking).toContain(PEOPLE_YOU_LABEL);
    expect(asking).toContain(confirmRoleChangePrompt('Ada Admin', 'Trader'));
    expect(asking).toContain(PEOPLE_CONFIRM_LABEL);
    expect(asking).not.toContain(PEOPLE_OWN_ROLE_NOTE);

    const denied = renderPanel({ error: PEOPLE_OWN_ROLE_NOTE });
    expect(denied).toContain(PEOPLE_OWN_ROLE_NOTE);
    expect(denied).toContain('data-testid="people-own-role-denied"');
    expect(denied).toContain('does not let you change the role you are signed in with');
  });

  it('shows an honest unavailable state for non-administrators', () => {
    const html = renderPanel({
      operators: [],
      forbidden: true,
      currentUserId: 'trader-1',
    });
    expect(html).toContain(PEOPLE_FORBIDDEN_TITLE);
    expect(html).toContain(PEOPLE_FORBIDDEN);
    expect(html).toContain('data-testid="people-forbidden"');
    expect(html).not.toContain('No people yet');
    expect(html).not.toContain(PEOPLE_CHANGE_LABEL);
    expect(html).not.toContain('Riley Reader');
  });

  it('shows last-Administrator failure honestly', () => {
    const html = renderPanel({ error: LAST_ADMIN_MESSAGE });
    expect(html).toContain(LAST_ADMIN_MESSAGE);
    expect(html).toContain('at least one active Administrator');
  });

  it('rejects unknown roles in product validation', () => {
    expect(isPeopleRole('Trader')).toBe(true);
    expect(isPeopleRole('Superuser')).toBe(false);
  });
});
