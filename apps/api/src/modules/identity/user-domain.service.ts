import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
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
 * Identity User domain service (US105, US107, PC-18).
 * create / getById / getByEmail / update / disable.
 * Storage is delegated to UserRepository (no owned Map as Source of Truth).
 * Reads are served from a hydrated cache so JWT validation stays synchronous.
 * Source of truth for user profile and role — no JWT / REST / Pipeline coupling.
 * Password hashes remain in Authentication (password-free Identity).
 */
@Injectable()
export class UserDomainService implements OnModuleInit {
  private readonly byId = new Map<string, User>();
  private readonly byEmail = new Map<string, User>();

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: UserRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const user of await this.repository.findAll()) {
      this.index(user);
    }
  }

  async create(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    assertNonEmpty(email, 'email');
    assertNonEmpty(input.displayName, 'displayName');

    if (this.byEmail.has(email)) {
      throw new Error(`User with email already exists: ${email}`);
    }

    const user: User = {
      id: toUserId(randomUUID()),
      email,
      displayName: input.displayName.trim(),
      status: UserStatus.Active,
      role: input.role ?? Role.Researcher,
    };

    await this.repository.save(user);
    this.index(user);
    return user;
  }

  getById(id: UserId | string): User | null {
    return this.byId.get(String(id)) ?? null;
  }

  getByEmail(email: string): User | null {
    return this.byEmail.get(normalizeEmail(email)) ?? null;
  }

  async update(id: UserId | string, input: UpdateUserInput): Promise<User | null> {
    const existing = this.byId.get(String(id));
    if (!existing) return null;

    const previousEmail = existing.email;

    if (input.email !== undefined) {
      const email = normalizeEmail(input.email);
      assertNonEmpty(email, 'email');
      const conflict = this.byEmail.get(email);
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

    await this.repository.save(existing);
    if (existing.email !== previousEmail) {
      this.byEmail.delete(previousEmail);
    }
    this.index(existing);
    return existing;
  }

  async disable(id: UserId | string): Promise<User | null> {
    const existing = this.byId.get(String(id));
    if (!existing) return null;

    existing.status = UserStatus.Disabled;
    await this.repository.save(existing);
    this.index(existing);
    return existing;
  }

  private index(user: User): void {
    this.byId.set(user.id, user);
    this.byEmail.set(normalizeEmail(user.email), user);
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
