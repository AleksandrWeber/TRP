import type { Role } from './role';
import type { UserId } from './user-id';
import type { UserStatus } from './user-status';

/**
 * Identity User aggregate (US105, US107).
 * Profile + role — no passwords, credentials, or auth tokens.
 */
export type User = {
  id: UserId;
  email: string;
  displayName: string;
  status: UserStatus;
  role: Role;
};
