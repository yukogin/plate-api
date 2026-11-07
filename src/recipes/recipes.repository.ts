import { Injectable } from '@nestjs/common';
import { Prisma, Recipe } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto, UpdateRecipeDto } from './recipe-input.dto';

const summarySelect = {
  id: true,
  title: true,
  description: true,
  prepTimeMinutes: true,
  servings: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.RecipeSelect;

export type RecipeSummary = Prisma.RecipeGetPayload<{ select: typeof summarySelect }>;

@Injectable()
export class RecipesRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.RecipeWhereInput): Promise<number> {
    return this.prisma.recipe.count({ where });
  }

  list(where: Prisma.RecipeWhereInput, page: number, limit: number): Promise<RecipeSummary[]> {
    const skip = (page - 1) * limit;
    if (!Number.isSafeInteger(skip) || skip > 2_147_483_647) return Promise.resolve([]);
    return this.prisma.recipe.findMany({
      where,
      select: summarySelect,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip,
      take: limit,
    });
  }

  findById(id: string): Promise<Recipe | null> {
    return this.prisma.recipe.findUnique({ where: { id } });
  }

  create(data: CreateRecipeDto): Promise<Recipe> {
    return this.prisma.recipe.create({ data });
  }

  update(id: string, data: UpdateRecipeDto): Promise<Recipe> {
    return this.prisma.recipe.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recipe.delete({ where: { id } });
  }
}
