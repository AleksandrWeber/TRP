import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { LoginBodyDto, RegisterBodyDto } from '../../validation';
import { Role } from '../identity/role';
import { AuthenticationService } from './authentication.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import type { AuthUser } from './jwt.strategy';

/**
 * Auth REST adapter (US106, US107, US114).
 * POST /v1/auth/register, POST /v1/auth/login (public); GET /v1/auth/me (JWT);
 * GET /v1/auth/admin (@Roles(Admin)).
 */
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authentication: AuthenticationService) {}

  @Public()
  @Post('register')
  register(@Body() body: RegisterBodyDto) {
    return this.authentication.register(body.email, body.displayName);
  }

  @Public()
  @Post('login')
  login(@Body() body: LoginBodyDto) {
    return this.authentication.login(body.email);
  }

  @Get('me')
  me(@Req() req: { user: AuthUser }) {
    return this.authentication.me(req.user.userId);
  }

  @Get('admin')
  @Roles(Role.Admin)
  admin(@Req() req: { user: AuthUser }) {
    return {
      message: 'admin ok',
      userId: req.user.userId,
      role: req.user.role,
    };
  }
}
