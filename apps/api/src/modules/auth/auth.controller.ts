import { Body, Controller, Delete, Get, Param, Post, Req, Res } from '@nestjs/common';
import {
  AuthSessionIdParamDto,
  ChangePasswordBodyDto,
  ForgotPasswordBodyDto,
  LoginBodyDto,
  RefreshBodyDto,
  RegisterBodyDto,
  ResetPasswordBodyDto,
} from '../../validation';
import { Role } from '../identity/role';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  type SessionRequestContext,
} from './auth-session';
import {
  appendSetCookies,
  csrfCookie,
  expiredAuthCookies,
  parseCookieHeader,
  sessionCookieBundle,
  type HeaderWriter,
} from './auth-cookies';
import { AuthenticationService } from './authentication.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import type { AuthUser } from './jwt.strategy';

type AuthRequest = {
  ip?: string;
  user?: AuthUser;
  headers: Record<string, string | string[] | undefined>;
};

/**
 * Auth REST adapter (US106, US107, US114, V3-S01-c/d).
 * POST /v1/auth/register, POST /v1/auth/login (public);
 * POST /v1/auth/refresh, POST /v1/auth/logout, GET /v1/auth/csrf (public);
 * GET /v1/auth/sessions, DELETE /v1/auth/sessions/:sessionId,
 * POST /v1/auth/sessions/revoke-others, POST /v1/auth/sessions/revoke-all (session);
 * GET /v1/auth/me (session); POST /v1/auth/change-password (session);
 * GET /v1/auth/recovery, POST /v1/auth/forgot-password, POST /v1/auth/reset-password (public);
 * GET /v1/auth/admin (@Roles(Admin)).
 */
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authentication: AuthenticationService) {}

  @Public()
  @Post('register')
  async register(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) reply: HeaderWriter,
    @Body() body: RegisterBodyDto,
  ) {
    const issued = await this.authentication.register(
      body.email,
      body.displayName,
      body.password,
      requestContext(req),
    );
    appendSetCookies(reply, sessionCookieBundle(issued));
    return this.authentication.toPublicTokenResponse(issued);
  }

  @Public()
  @Post('login')
  async login(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) reply: HeaderWriter,
    @Body() body: LoginBodyDto,
  ) {
    const issued = await this.authentication.login(body.email, body.password, requestContext(req));
    appendSetCookies(reply, sessionCookieBundle(issued));
    return this.authentication.toPublicTokenResponse(issued);
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) reply: HeaderWriter,
    @Body() body?: RefreshBodyDto,
  ) {
    const cookies = parseCookieHeader(req.headers.cookie);
    const refreshToken = body?.refreshToken || cookies[REFRESH_COOKIE_NAME];
    const issued = await this.authentication.refresh(refreshToken ?? '', requestContext(req));
    appendSetCookies(reply, sessionCookieBundle(issued));
    return this.authentication.toPublicTokenResponse(issued);
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) reply: HeaderWriter,
    @Body() body?: RefreshBodyDto,
  ) {
    const cookies = parseCookieHeader(req.headers.cookie);
    const refreshToken = body?.refreshToken || cookies[REFRESH_COOKIE_NAME];
    const accessToken = bearerToken(req) ?? cookies[ACCESS_COOKIE_NAME];
    try {
      if (refreshToken) {
        await this.authentication.logoutByRefresh(refreshToken, requestContext(req));
      } else if (accessToken) {
        const user = await this.authentication.validateToken(accessToken);
        await this.authentication.logout(user.userId, user.sessionId, requestContext(req));
      }
    } catch {
      // Logout always clears cookies so the operator can leave a dead session.
    }
    appendSetCookies(reply, expiredAuthCookies());
    return { ok: true };
  }

  @Public()
  @Get('csrf')
  csrf(@Res({ passthrough: true }) reply: HeaderWriter) {
    const csrfToken = this.authentication.issueCsrfToken();
    appendSetCookies(reply, [csrfCookie(csrfToken)]);
    return { csrfToken };
  }

  @Public()
  @Get('recovery')
  recovery() {
    return this.authentication.recoveryStatus();
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Req() req: AuthRequest, @Body() body: ForgotPasswordBodyDto) {
    return this.authentication.requestPasswordReset(body.email, requestContext(req));
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Req() req: AuthRequest, @Body() body: ResetPasswordBodyDto) {
    return this.authentication.resetPassword(body.token, body.password, requestContext(req));
  }

  @Post('change-password')
  async changePassword(@Req() req: AuthRequest, @Body() body: ChangePasswordBodyDto) {
    return this.authentication.changePassword(
      req.user!.userId,
      req.user!.sessionId,
      body.currentPassword,
      body.newPassword,
      requestContext(req),
    );
  }

  @Get('sessions')
  async listSessions(@Req() req: { user: AuthUser }) {
    return {
      sessions: await this.authentication.listSessions(req.user.userId, req.user.sessionId),
    };
  }

  @Post('sessions/revoke-others')
  async revokeOtherSessions(@Req() req: AuthRequest) {
    return this.authentication.revokeOtherSessions(
      req.user!.userId,
      req.user!.sessionId,
      requestContext(req),
    );
  }

  @Post('sessions/revoke-all')
  async revokeAllSessions(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) reply: HeaderWriter,
  ) {
    const result = await this.authentication.revokeAllSessions(
      req.user!.userId,
      req.user!.sessionId,
      requestContext(req),
    );
    appendSetCookies(reply, expiredAuthCookies());
    return result;
  }

  @Delete('sessions/:sessionId')
  async revokeSession(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) reply: HeaderWriter,
    @Param() params: AuthSessionIdParamDto,
  ) {
    const result = await this.authentication.revokeSession(
      req.user!.userId,
      params.sessionId,
      req.user!.sessionId,
      requestContext(req),
    );
    if (result.endedCurrent) {
      appendSetCookies(reply, expiredAuthCookies());
    }
    return result;
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

function requestContext(req: AuthRequest): SessionRequestContext {
  const userAgent = req.headers['user-agent'];
  return {
    ip: req.ip,
    userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
  };
}

function bearerToken(req: AuthRequest): string | undefined {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value || !value.startsWith('Bearer ')) return undefined;
  return value.slice('Bearer '.length);
}
