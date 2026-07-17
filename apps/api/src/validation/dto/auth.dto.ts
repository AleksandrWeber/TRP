import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;
}

export class LoginBodyDto {
  @IsEmail()
  email!: string;
}
