import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class AnalyzeReceiptDto {
  @IsString()
  @IsNotEmpty()
  imageBase64!: string;

  @IsOptional()
  @IsString()
  @Matches(/^image\/.+/)
  mimeType?: string;
}