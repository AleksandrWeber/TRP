import { IsOptional, IsString } from 'class-validator';

/**
 * Campaign export query DTO (US113).
 * "format" required / allowed-values business rules remain manual
 * BadRequestException checks in the controller.
 */
export class ExportCampaignQueryDto {
  @IsOptional()
  @IsString()
  format?: string;
}
