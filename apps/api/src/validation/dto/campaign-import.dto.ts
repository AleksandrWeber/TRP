import { IsOptional, IsString } from 'class-validator';

/**
 * Campaign import body DTO (US113).
 * Format / payload "required" and content checks remain manual
 * BadRequestException business rules in the controller.
 */
export class ImportCampaignBodyDto {
  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  payload?: string;
}
