import { Transform } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString,
  Max, MaxLength, Min, MinLength, registerDecorator, ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimStringArray = ({ value }: { value: unknown }): unknown =>
  Array.isArray(value)
    ? value.map((item: unknown) => typeof item === 'string' ? item.trim() : item)
    : value;

function IsHttpUrl(): PropertyDecorator {
  return (target, propertyName) => registerDecorator({
    name: 'isHttpUrl',
    target: target.constructor,
    propertyName: String(propertyName),
    validator: {
      validate(value: unknown): boolean {
        if (typeof value !== 'string' || value !== value.trim()) return false;
        try {
          const url = new URL(value);
          return ['http:', 'https:'].includes(url.protocol) && !!url.hostname;
        } catch {
          return false;
        }
      },
      defaultMessage(): string { return 'imageUrl must be an HTTP or HTTPS URL'; },
    },
  });
}

export class CreateRecipeDto {
  @ApiProperty({ minLength: 1, maxLength: 200, example: 'Овсяные панкейки' })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiProperty({ type: [String], minItems: 1, maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 500 } })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  ingredients!: string[];

  @ApiProperty({ type: [String], minItems: 1, maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 5000 } })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(5000, { each: true })
  steps!: string[];

  @ApiPropertyOptional({ type: 'integer', nullable: true, minimum: 1, maximum: 10080 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080)
  prepTimeMinutes?: number | null;

  @ApiPropertyOptional({ type: 'integer', nullable: true, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  servings?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2048, format: 'uri', description: 'Только http или https' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsHttpUrl()
  imageUrl?: string | null;
}

export class UpdateRecipeDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 200 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ type: [String], minItems: 1, maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 500 } })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(trimStringArray)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  ingredients?: string[];

  @ApiPropertyOptional({ type: [String], minItems: 1, maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 5000 } })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(trimStringArray)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(5000, { each: true })
  steps?: string[];

  @ApiPropertyOptional({ type: 'integer', nullable: true, minimum: 1, maximum: 10080 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080)
  prepTimeMinutes?: number | null;

  @ApiPropertyOptional({ type: 'integer', nullable: true, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  servings?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2048, format: 'uri', description: 'Только http или https' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsHttpUrl()
  imageUrl?: string | null;
}
