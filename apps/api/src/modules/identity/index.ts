export { IdentityModule } from './identity.module';
export { UserDomainService } from './user-domain.service';
export type { CreateUserInput, UpdateUserInput } from './user-domain.service';
export type { User } from './user';
export type { UserId } from './user-id';
export { toUserId } from './user-id';
export { UserStatus } from './user-status';
export { Role } from './role';
export type { UserRepository } from './repositories/user.repository';
export { USER_REPOSITORY } from './repositories/user.repository.token';
export { InMemoryUserRepository } from './repositories/in-memory-user.repository';
export { DevelopmentIdentityBootstrap } from './development-identity.bootstrap';
export {
  DEVELOPMENT_IDENTITY_EMAIL,
  DEVELOPMENT_IDENTITY_DISPLAY_NAME,
  shouldBootstrapDevelopmentIdentity,
} from './development-identity';
