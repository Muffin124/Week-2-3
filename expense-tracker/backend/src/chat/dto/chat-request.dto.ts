import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsArray()
  expenses?: unknown[];

  @IsOptional()
  @IsArray()
  transactions?: unknown[];

  @IsOptional()
  @IsArray()
  history?: unknown[];
}