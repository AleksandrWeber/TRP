import { beforeEach, describe, expect, it } from 'vitest';
import { Role } from './role';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { UserDomainService } from './user-domain.service';
import { UserStatus } from './user-status';

describe('UserDomainService (US105, US107)', () => {
  let service: UserDomainService;

  beforeEach(() => {
    service = new UserDomainService(new InMemoryUserRepository());
  });

  it('creates an active Researcher by default', () => {
    const user = service.create({
      email: 'Ada@Example.com',
      displayName: ' Ada Lovelace ',
    });

    expect(user.id.length).toBeGreaterThan(0);
    expect(user.email).toBe('ada@example.com');
    expect(user.displayName).toBe('Ada Lovelace');
    expect(user.status).toBe(UserStatus.Active);
    expect(user.role).toBe(Role.Researcher);
    expect(Object.keys(user).sort()).toEqual(['displayName', 'email', 'id', 'role', 'status']);
  });

  it('creates with an explicit role', () => {
    const user = service.create({
      email: 'admin@example.com',
      displayName: 'Admin',
      role: Role.Admin,
    });

    expect(user.role).toBe(Role.Admin);
  });

  it('rejects duplicate emails on create', () => {
    service.create({ email: 'a@example.com', displayName: 'A' });

    expect(() => service.create({ email: 'A@Example.com', displayName: 'B' })).toThrow(
      /already exists/i,
    );
  });

  it('getById and getByEmail return the same user', () => {
    const created = service.create({ email: 'b@example.com', displayName: 'B' });

    expect(service.getById(created.id)).toEqual(created);
    expect(service.getByEmail('B@Example.com')).toEqual(created);
    expect(service.getById('missing')).toBeNull();
    expect(service.getByEmail('missing@example.com')).toBeNull();
  });

  it('updates displayName, email, and role', () => {
    const created = service.create({ email: 'c@example.com', displayName: 'C' });

    const updated = service.update(created.id, {
      email: 'c2@example.com',
      displayName: 'C Two',
      role: Role.Reader,
    });

    expect(updated).toEqual({
      id: created.id,
      email: 'c2@example.com',
      displayName: 'C Two',
      status: UserStatus.Active,
      role: Role.Reader,
    });
    expect(service.getByEmail('c@example.com')).toBeNull();
    expect(service.getByEmail('c2@example.com')?.displayName).toBe('C Two');
  });

  it('update returns null when user is missing', () => {
    expect(service.update('missing', { displayName: 'X' })).toBeNull();
  });

  it('rejects email conflict on update', () => {
    service.create({ email: 'one@example.com', displayName: 'One' });
    const two = service.create({ email: 'two@example.com', displayName: 'Two' });

    expect(() => service.update(two.id, { email: 'one@example.com' })).toThrow(/already exists/i);
  });

  it('disable sets status to Disabled', () => {
    const created = service.create({ email: 'd@example.com', displayName: 'D' });

    const disabled = service.disable(created.id);

    expect(disabled?.status).toBe(UserStatus.Disabled);
    expect(service.getById(created.id)?.status).toBe(UserStatus.Disabled);
  });

  it('disable returns null when user is missing', () => {
    expect(service.disable('missing')).toBeNull();
  });
});
