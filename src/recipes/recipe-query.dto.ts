import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const parsePositiveInteger = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return value;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : value;
};

export class RecipeQueryDto {
  @ApiPropertyOptional({ type: 'integer', default: 1, minimum: 1 })
  @Transform(parsePositiveInteger)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: 'integer', default: 20, minimum: 1, maximum: 100 })
  @Transform(parsePositiveInteger)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ maxLength: 200, description: 'Буквальная подстрока title или description' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
