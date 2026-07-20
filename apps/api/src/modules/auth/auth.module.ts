import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { IdentityModule } from '../identity/identity.module';
import { WorkspaceModule } from '../workspace';
import { AuthController } from './auth.controller';
import { AuthDevelopmentBootstrap } from './auth-development.bootstrap';
import { AuthenticationService } from './authentication.service';
import { CommandAuthorizationService } from './command-authorization.service';
import { resolveJwtSecret } from './jwt-secret';
import { JwtStrategy } from './jwt.strategy';
import { PasswordCredentialStore } from './password-credential.store';

/**
 * Authentication module (US106 / US158).
 * JWT on top of Identity with production secret hardening and trading RBAC.
 */
@Module({
  imports: [
    IdentityModule,
    WorkspaceModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '8h') as `${number}h`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthenticationService,
    PasswordCredentialStore,
    JwtStrategy,
    CommandAuthorizationService,
    AuthDevelopmentBootstrap,
  ],
  exports: [AuthenticationService, PasswordCredentialStore, JwtModule, CommandAuthorizationService],
})
export class AuthModule {}
