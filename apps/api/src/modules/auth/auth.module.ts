import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { WorkspaceModule } from '../workspace';
import { SecurityAuditModule } from '../security-audit';
import { AuthController } from './auth.controller';
import { SYSTEM_CLOCK as SESSION_CLOCK, resolveAccessJwtExpiresIn } from './auth-session';
import { AUTH_SESSION_CLOCK, AUTH_SESSION_REPOSITORY } from './auth-session.repository.token';
import { AuthSessionStore } from './auth-session.store';
import { AuthenticationService } from './authentication.service';
import { AuthorizationDecisionService } from './authorization-decision.service';
import { CommandAuthorizationService } from './command-authorization.service';
import { resolveJwtSecret } from './jwt-secret';
import { JwtStrategy } from './jwt.strategy';
import { SYSTEM_CLOCK } from './login-lockout';
import { LOGIN_LOCKOUT_CLOCK, LOGIN_LOCKOUT_REPOSITORY } from './login-lockout.repository.token';
import { LoginLockoutStore } from './login-lockout.store';
import { PASSWORD_CREDENTIAL_REPOSITORY } from './password-credential.repository.token';
import { PasswordCredentialStore } from './password-credential.store';
import { PrismaAuthSessionRepository } from './prisma-auth-session.repository';
import { PrismaLoginLockoutRepository } from './prisma-login-lockout.repository';
import { PrismaPasswordCredentialRepository } from './prisma-password-credential.repository';
import { PrismaPasswordResetRepository } from './prisma-password-reset.repository';
import { PasswordResetStore } from './password-reset.store';
import { PASSWORD_RESET_CLOCK, PASSWORD_RESET_REPOSITORY } from './password-reset.repository.token';
import { SYSTEM_CLOCK as RESET_CLOCK } from './password-reset';
import { createHostMail } from './host-mail.factory';
import { HOST_MAIL } from './host-mail';

/**
 * Authentication module (US106 / US158 / PC-18 / V3-S01-e).
 * JWT on top of Identity with durable password hashes and revocable sessions.
 * Authorization decisions (V3-S02-a) live here; Identity still owns `User.role`.
 * Development bootstrap is not part of the product path.
 */
@Module({
  imports: [
    IdentityModule,
    WorkspaceModule,
    SecurityAuditModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: {
          expiresIn: resolveAccessJwtExpiresIn(config.get<string>('JWT_EXPIRES_IN')) as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthenticationService,
    {
      provide: PASSWORD_CREDENTIAL_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPasswordCredentialRepository(prisma),
      inject: [PrismaService],
    },
    PasswordCredentialStore,
    {
      provide: LOGIN_LOCKOUT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaLoginLockoutRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: LOGIN_LOCKOUT_CLOCK,
      useValue: SYSTEM_CLOCK,
    },
    LoginLockoutStore,
    {
      provide: AUTH_SESSION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaAuthSessionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: AUTH_SESSION_CLOCK,
      useValue: SESSION_CLOCK,
    },
    AuthSessionStore,
    {
      provide: PASSWORD_RESET_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPasswordResetRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PASSWORD_RESET_CLOCK,
      useValue: RESET_CLOCK,
    },
    PasswordResetStore,
    {
      provide: HOST_MAIL,
      useFactory: (config: ConfigService) => createHostMail(config),
      inject: [ConfigService],
    },
    JwtStrategy,
    AuthorizationDecisionService,
    CommandAuthorizationService,
  ],
  exports: [
    AuthenticationService,
    PasswordCredentialStore,
    JwtModule,
    AuthorizationDecisionService,
    CommandAuthorizationService,
  ],
})
export class AuthModule {}
