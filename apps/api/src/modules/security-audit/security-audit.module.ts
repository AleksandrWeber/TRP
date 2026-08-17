import { Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { PrismaSecurityAuditRepository } from './prisma-security-audit.repository';
import { PrismaSecurityAuditIncidentRepository } from './prisma-security-audit-incident.repository';
import { SecurityAuditIntegrityService } from './security-audit-integrity.service';
import { SecurityAuditExportService } from './security-audit-export.service';
import { SecurityAuditIncidentService } from './security-audit-incident.service';
import { SECURITY_AUDIT_INCIDENT_REPOSITORY } from './security-audit-incident.repository.token';
import { SECURITY_AUDIT_REPOSITORY } from './security-audit.repository.token';
import { SecurityAuditService } from './security-audit.service';
import { SecurityAuditTimelineService } from './security-audit-timeline.service';

/**
 * Security Audit Product foundation (V3-S05-a).
 * It owns storage and read models, while HTTP composition stays separate.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: SECURITY_AUDIT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaSecurityAuditRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: SECURITY_AUDIT_INCIDENT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaSecurityAuditIncidentRepository(prisma),
      inject: [PrismaService],
    },
    SecurityAuditService,
    SecurityAuditIntegrityService,
    SecurityAuditIncidentService,
    SecurityAuditExportService,
    SecurityAuditTimelineService,
  ],
  exports: [
    SecurityAuditService,
    SecurityAuditIntegrityService,
    SecurityAuditIncidentService,
    SecurityAuditExportService,
    SecurityAuditTimelineService,
  ],
})
export class SecurityAuditModule {}
