import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
