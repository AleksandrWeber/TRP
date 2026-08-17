import { beforeEach, describe, expect, it } from 'vitest';
import {
  LastAdminProtectedError,
  SelfRoleChangeError,
  UnknownRoleError,
} from './role-assignment.errors';
import { Role } from './role';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { UserDomainService } from './user-domain.service';
import { UserStatus } from './user-status';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';

class RollbackTransactionService {
  constructor(private readonly rollback: () => Promise<void>) {}

  async run<T>(work: (transaction: TransactionContext) => Promise<T>): Promise<T> {
    try {
      return await work(Object.freeze({}) as TransactionContext);
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}

describe('UserDomainService (US105, US107)', () => {
  let service: UserDomainService;

  beforeEach(() => {
    service = new UserDomainService(new InMemoryUserRepository());
  });

  it('creates an active Researcher by default', async () => {
    const user = await service.create({
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

  it('creates with an explicit role', async () => {
    const user = await service.create({
      email: 'admin@example.com',
      displayName: 'Admin',
      role: Role.Admin,
    });

    expect(user.role).toBe(Role.Admin);
  });

  it('rejects duplicate emails on create', async () => {
    await service.create({ email: 'a@example.com', displayName: 'A' });

    await expect(service.create({ email: 'A@Example.com', displayName: 'B' })).rejects.toThrow(
      /already exists/i,
    );
  });

  it('getById and getByEmail return the same user', async () => {
    const created = await service.create({ email: 'b@example.com', displayName: 'B' });

    expect(service.getById(created.id)).toEqual(created);
    expect(service.getByEmail('B@Example.com')).toEqual(created);
    expect(service.getById('missing')).toBeNull();
    expect(service.getByEmail('missing@example.com')).toBeNull();
  });

  it('updates displayName, email, and role', async () => {
    const created = await service.create({ email: 'c@example.com', displayName: 'C' });

    const updated = await service.update(created.id, {
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

  it('update returns null when user is missing', async () => {
    expect(await service.update('missing', { displayName: 'X' })).toBeNull();
  });

  it('rejects email conflict on update', async () => {
    await service.create({ email: 'one@example.com', displayName: 'One' });
    const two = await service.create({ email: 'two@example.com', displayName: 'Two' });

    await expect(service.update(two.id, { email: 'one@example.com' })).rejects.toThrow(
      /already exists/i,
    );
  });

  it('disable sets status to Disabled', async () => {
    const created = await service.create({ email: 'd@example.com', displayName: 'D' });

    const disabled = await service.disable(created.id);

    expect(disabled?.status).toBe(UserStatus.Disabled);
    expect(service.getById(created.id)?.status).toBe(UserStatus.Disabled);
  });

  it('disable returns null when user is missing', async () => {
    expect(await service.disable('missing')).toBeNull();
  });

  it('lists operators sorted by email without extra fields', async () => {
    await service.create({ email: 'zeta@example.com', displayName: 'Zeta', role: Role.Trader });
    await service.create({ email: 'alpha@example.com', displayName: 'Alpha' });

    const listed = service.list();
    expect(listed.map((user) => user.email)).toEqual(['alpha@example.com', 'zeta@example.com']);
    expect(
      listed.every(
        (user) => Object.keys(user).sort().join() === 'displayName,email,id,role,status',
      ),
    ).toBe(true);
  });

  it('assignRole persists a known role immediately', async () => {
    const created = await service.create({ email: 'op@example.com', displayName: 'Op' });

    const assigned = await service.assignRole(created.id, Role.Trader);

    expect(assigned?.role).toBe(Role.Trader);
    expect(service.getById(created.id)?.role).toBe(Role.Trader);
  });

  it('commits one role mutation only after its mandatory audit append succeeds', async () => {
    const repository = new InMemoryUserRepository();
    const atomicService = new UserDomainService(repository);
    const created = await atomicService.create({
      email: 'atomic@example.com',
      displayName: 'Atomic',
    });
    let auditWrites = 0;

    const assigned = await atomicService.assignRoleWithMandatoryAudit(
      created.id,
      Role.Trader,
      'admin-1',
      new RollbackTransactionService(async () => undefined),
      async () => {
        auditWrites += 1;
      },
    );

    expect(assigned?.role).toBe(Role.Trader);
    expect(atomicService.getById(created.id)?.role).toBe(Role.Trader);
    expect(await repository.findById(created.id)).toMatchObject({ role: Role.Trader });
    expect(auditWrites).toBe(1);
  });

  it('rolls back a role mutation when its mandatory audit append fails', async () => {
    const repository = new InMemoryUserRepository();
    const atomicService = new UserDomainService(repository);
    const created = await atomicService.create({
      email: 'rollback@example.com',
      displayName: 'Rollback',
    });
    const original = { ...created };

    await expect(
      atomicService.assignRoleWithMandatoryAudit(
        created.id,
        Role.Trader,
        'admin-1',
        new RollbackTransactionService(() => repository.save(original)),
        async () => {
          throw new Error('audit append failed');
        },
      ),
    ).rejects.toThrow('audit append failed');

    expect(atomicService.getById(created.id)?.role).toBe(Role.Researcher);
    expect(await repository.findById(created.id)).toMatchObject({ role: Role.Researcher });
  });

  it('assignRole returns null when the user is missing', async () => {
    expect(await service.assignRole('missing', Role.Trader)).toBeNull();
  });

  it('assignRole rejects an unknown role without changing Identity', async () => {
    const created = await service.create({ email: 'op@example.com', displayName: 'Op' });

    await expect(service.assignRole(created.id, 'Superuser' as Role)).rejects.toBeInstanceOf(
      UnknownRoleError,
    );
    expect(service.getById(created.id)?.role).toBe(Role.Researcher);
  });

  it('refuses to demote the last active Administrator', async () => {
    const onlyAdmin = await service.create({
      email: 'admin@example.com',
      displayName: 'Admin',
      role: Role.Admin,
    });

    await expect(service.assignRole(onlyAdmin.id, Role.Trader)).rejects.toBeInstanceOf(
      LastAdminProtectedError,
    );
    await expect(service.update(onlyAdmin.id, { role: Role.Reader })).rejects.toBeInstanceOf(
      LastAdminProtectedError,
    );
    expect(service.getById(onlyAdmin.id)?.role).toBe(Role.Admin);
  });

  it('allows demoting a second Administrator', async () => {
    await service.create({ email: 'admin-a@example.com', displayName: 'A', role: Role.Admin });
    const second = await service.create({
      email: 'admin-b@example.com',
      displayName: 'B',
      role: Role.Admin,
    });

    const demoted = await service.assignRole(second.id, Role.Trader);

    expect(demoted?.role).toBe(Role.Trader);
    expect(service.list().filter((user) => user.role === Role.Admin)).toHaveLength(1);
  });

  it('does not count a disabled Administrator toward last-Admin protection', async () => {
    const active = await service.create({
      email: 'active-admin@example.com',
      displayName: 'Active',
      role: Role.Admin,
    });
    const disabled = await service.create({
      email: 'disabled-admin@example.com',
      displayName: 'Disabled',
      role: Role.Admin,
    });
    await service.disable(disabled.id);

    await expect(service.assignRole(active.id, Role.Trader)).rejects.toBeInstanceOf(
      LastAdminProtectedError,
    );
    const changed = await service.assignRole(disabled.id, Role.Reader);
    expect(changed?.role).toBe(Role.Reader);
    expect(service.getById(active.id)?.role).toBe(Role.Admin);
  });

  it('refuses an Administrator changing their own role even when another Admin exists', async () => {
    const first = await service.create({
      email: 'admin-a@example.com',
      displayName: 'A',
      role: Role.Admin,
    });
    const second = await service.create({
      email: 'admin-b@example.com',
      displayName: 'B',
      role: Role.Admin,
    });

    await expect(service.assignRole(first.id, Role.Trader, first.id)).rejects.toBeInstanceOf(
      SelfRoleChangeError,
    );
    expect(service.getById(first.id)?.role).toBe(Role.Admin);

    const demoted = await service.assignRole(first.id, Role.Trader, second.id);
    expect(demoted?.role).toBe(Role.Trader);
  });
});
