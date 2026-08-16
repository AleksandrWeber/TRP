import type { SignInSessionView } from '../shared/api';

export const CURRENT_SESSION_LABEL = 'This device';

export const SESSIONS_PAGE_TITLE = 'Sign-in sessions';

export const SESSIONS_PAGE_DESCRIPTION =
  'See where you are signed in. End a sign-in you no longer trust. This is not a trusted-device list.';

export const SESSIONS_LOCATION_NOTE =
  'Location is the network address seen at sign-in. It is not a map, a city, or a trusted device.';

export const REVOKE_ONE_PROMPT = 'End this sign-in? That device will lose access immediately.';

export const REVOKE_OTHERS_PROMPT =
  'End every other sign-in? You will stay signed in here. Other devices lose access immediately.';

export const REVOKE_ALL_PROMPT =
  'Sign out everywhere? You will need to sign in again on this device too.';

export const REVOKE_ONE_SUCCESS = 'That sign-in has ended.';

export const REVOKE_OTHERS_SUCCESS = 'Other sign-ins have ended. You are still signed in here.';

export const REVOKE_OTHERS_EMPTY = 'No other sign-ins to end.';

export const SESSIONS_LOAD_ERROR = 'Could not load sign-in sessions.';

export const SESSIONS_ACTION_ERROR = 'Could not end that sign-in. Please try again.';

export type SessionPendingAction =
  { kind: 'revoke-one'; sessionId: string } | { kind: 'revoke-others' } | { kind: 'revoke-all' };

export function networkLabel(network: string | null | undefined): string {
  const value = network?.trim();
  return value ? `Network ${value}` : 'Location unavailable';
}

export function formatSessionTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

export function otherSessions(sessions: readonly SignInSessionView[]): SignInSessionView[] {
  return sessions.filter((session) => !session.current);
}

export function confirmCopy(pending: SessionPendingAction | null): string | null {
  if (!pending) return null;
  if (pending.kind === 'revoke-one') return REVOKE_ONE_PROMPT;
  if (pending.kind === 'revoke-others') return REVOKE_OTHERS_PROMPT;
  return REVOKE_ALL_PROMPT;
}
