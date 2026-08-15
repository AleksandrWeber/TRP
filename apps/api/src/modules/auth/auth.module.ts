import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { WorkspaceModule } from '../workspace';
import { AuthController } from './auth.controller';
import { AuthenticationService } from './authentication.service';
import { CommandAuthorizationService } from './command-authorization.service';
import { resolveJwtSecret } from './jwt-secret';
import { JwtStrategy } from './jwt.strategy';
import { PASSWORD_CREDENTIAL_REPOSITORY } from './password-credential.repository.token';
import { PasswordCredentialStore } from './password-credential.store';
import { PrismaPasswordCredentialRepository } from './prisma-password-credential.repository';

/**
 * Authentication module (US106 / US158 / PC-18).
 * JWT on top of Identity with durable password hashes on the existing User table.
 * Development bootstrap is not part of the product path.
 */
@Module({
  imports: [
    IdentityModule,
    WorkspaceModule,
    PrismaModule,
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
    {
      provide: PASSWORD_CREDENTIAL_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPasswordCredentialRepository(prisma),
      inject: [PrismaService],
    },
    PasswordCredentialStore,
    JwtStrategy,
    CommandAuthorizationService,
  ],
  exports: [AuthenticationService, PasswordCredentialStore, JwtModule, CommandAuthorizationService],
})
export class AuthModule {}
