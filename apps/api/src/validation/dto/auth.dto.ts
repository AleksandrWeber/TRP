import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { IsProductPassword } from '../is-product-password.validator';

export class RegisterBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsString()
  @IsProductPassword()
  password!: string;
}

export class LoginBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshBodyDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class AuthSessionIdParamDto {
  @IsUUID('4')
  sessionId!: string;
}

export class ForgotPasswordBodyDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordBodyDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @IsProductPassword()
  password!: string;
}

export class ChangePasswordBodyDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @IsProductPassword()
  newPassword!: string;
}
