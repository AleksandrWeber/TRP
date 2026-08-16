export const PEOPLE_PAGE_TITLE = 'People';
export const PEOPLE_PAGE_DESCRIPTION =
  'See who can use this product and assign Reader, Researcher, Trader, or Administrator.';
export const PEOPLE_FORBIDDEN_TITLE = 'People is unavailable';
export const PEOPLE_FORBIDDEN =
  'People is only available to Administrators. This is not an empty directory.';
export const PEOPLE_LOAD_ERROR = 'Could not load people.';
export const PEOPLE_ACTION_ERROR = 'Could not change that role.';
export const PEOPLE_SUCCESS = 'Role changed. The new role applies immediately.';
export const PEOPLE_YOU_LABEL = 'You';
export const PEOPLE_OWN_ROLE_NOTE = 'You cannot change your own role.';
export const PEOPLE_CHANGE_LABEL = 'Change role';
export const PEOPLE_CONFIRM_LABEL = 'Confirm role change';
export const LAST_ADMIN_MESSAGE = 'Cannot change the last active Administrator.';

export const PEOPLE_ROLES = ['Reader', 'Researcher', 'Trader', 'Admin'] as const;

export type PeopleRole = (typeof PEOPLE_ROLES)[number];

export function isPeopleRole(value: string): value is PeopleRole {
  return (PEOPLE_ROLES as readonly string[]).includes(value);
}

export function roleLabel(role: string): string {
  if (role === 'Admin') return 'Administrator';
  return role;
}

export function isCurrentOperator(operatorId: string, currentUserId: string | null): boolean {
  return Boolean(currentUserId) && operatorId === currentUserId;
}

export function confirmRoleChangePrompt(displayName: string, role: PeopleRole): string {
  return `Change ${displayName} to ${roleLabel(role)}? They keep their sign-in. The new role applies on their next action.`;
}
