import { ApiProperty } from '@nestjs/swagger';

export class RecipeSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty({ nullable: true, type: 'integer' })
  prepTimeMinutes!: number | null;

  @ApiProperty({ nullable: true, type: 'integer' })
  servings!: number | null;

  @ApiProperty({ nullable: true, type: String })
  imageUrl!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class RecipeDto extends RecipeSummaryDto {
  @ApiProperty({ type: [String] })
  ingredients!: string[];

  @ApiProperty({ type: [String] })
  steps!: string[];
}

export class RecipeListDto {
  @ApiProperty({ type: [RecipeSummaryDto] })
  items!: RecipeSummaryDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}
