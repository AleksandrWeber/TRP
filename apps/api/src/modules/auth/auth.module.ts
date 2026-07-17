import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { IdentityModule } from '../identity/identity.module';
import { AuthController } from './auth.controller';
import { AuthenticationService } from './authentication.service';
import { JwtStrategy } from './jwt.strategy';

/**
 * Authentication module (US106).
 * JWT on top of Identity — no passwords, no RBAC, no Workspace.
 */
@Module({
  imports: [
    IdentityModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-only-change-me',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '8h') as `${number}h`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthenticationService, JwtStrategy],
  exports: [AuthenticationService, JwtModule],
})
export class AuthModule {}
