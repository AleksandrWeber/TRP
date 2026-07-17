import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from './role';
import type { User } from './user';
import { toUserId, type UserId } from './user-id';
import { UserStatus } from './user-status';
import type { UserRepository } from './repositories/user.repository';
import { USER_REPOSITORY } from './repositories/user.repository.token';

export type CreateUserInput = {
  email: string;
  displayName: string;
  /** Defaults to Researcher when omitted. */
  role?: Role;
};

export type UpdateUserInput = {
  email?: string;
  displayName?: string;
  role?: Role;
};

/**
 * Identity User domain service (US105, US107).
 * create / getById / getByEmail / update / disable.
 * Storage is delegated to UserRepository (no owned Map).
 * Source of truth for user profile and role — no JWT / REST / Pipeline coupling.
 */
@Injectable()
export class UserDomainService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: UserRepository,
  ) {}

  create(input: CreateUserInput): User {
    const email = normalizeEmail(input.email);
    assertNonEmpty(email, 'email');
    assertNonEmpty(input.displayName, 'displayName');

    if (this.repository.findByEmail(email)) {
      throw new Error(`User with email already exists: ${email}`);
    }

    const user: User = {
      id: toUserId(randomUUID()),
      email,
      displayName: input.displayName.trim(),
      status: UserStatus.Active,
      role: input.role ?? Role.Researcher,
    };

    this.repository.save(user);
    return user;
  }

  getById(id: UserId | string): User | null {
    return this.repository.findById(id);
  }

  getByEmail(email: string): User | null {
    return this.repository.findByEmail(normalizeEmail(email));
  }

  update(id: UserId | string, input: UpdateUserInput): User | null {
    const existing = this.repository.findById(id);
    if (!existing) return null;

    if (input.email !== undefined) {
      const email = normalizeEmail(input.email);
      assertNonEmpty(email, 'email');
      const conflict = this.repository.findByEmail(email);
      if (conflict && conflict.id !== existing.id) {
        throw new Error(`User with email already exists: ${email}`);
      }
      existing.email = email;
    }

    if (input.displayName !== undefined) {
      assertNonEmpty(input.displayName, 'displayName');
      existing.displayName = input.displayName.trim();
    }

    if (input.role !== undefined) {
      existing.role = input.role;
    }

    this.repository.save(existing);
    return existing;
  }

  disable(id: UserId | string): User | null {
    const existing = this.repository.findById(id);
    if (!existing) return null;

    existing.status = UserStatus.Disabled;
    this.repository.save(existing);
    return existing;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}
