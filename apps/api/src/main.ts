import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { AppModule } from './app.module';
import { LOGGER } from './logging/logger.token';
import { SecurityAuditService } from './modules/security-audit/security-audit.service';
import {
  assertSecurityPlatformBoot,
  createBrowserSecurityPolicy,
  registerSecurityPlatformHttpHooks,
} from './security-platform';

async function bootstrap() {
  const securityConfig = assertSecurityPlatformBoot();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      bodyLimit: securityConfig.maxRequestBodyBytes,
      requestTimeout: securityConfig.requestTimeoutMs,
    }),
  );

  // Global ValidationPipe is registered via ValidationModule (APP_PIPE) — US113.

  // URI versioning: /v1/... (US114). Health / root remain VERSION_NEUTRAL.
  app.enableVersioning({
    type: VersioningType.URI,
  });

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
      ];
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    // Fastify CORS otherwise reflects only GET/HEAD/POST; Strategy CRUD (US004)
    // is the first browser consumer of PATCH/DELETE.
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(helmet, {
    global: true,
    ...createBrowserSecurityPolicy(),
  });

  await app.register(rateLimit, {
    global: true,
    max: securityConfig.platformAbusePolicy.general.limit,
    timeWindow: securityConfig.platformAbusePolicy.general.windowMs,
  });

  registerSecurityPlatformHttpHooks(app.getHttpAdapter().getInstance(), securityConfig, {
    logger: app.get(LOGGER),
    audit: app.get(SecurityAuditService),
  });

  const port = Number(process.env.API_PORT ?? 3000);
  const host = process.env.API_HOST ?? '0.0.0.0';

  await app.listen({ port, host });
}

void bootstrap();
