import { IsString, MinLength } from 'class-validator';

export class SignalIntentIdParamDto {
  @IsString()
  @MinLength(1)
  id!: string;
}

export class ListSignalIntentsQueryDto {
  @IsString()
  @MinLength(1)
  sessionId!: string;
}
