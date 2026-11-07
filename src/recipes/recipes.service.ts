import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Recipe } from '@prisma/client';
import { CreateRecipeDto, UpdateRecipeDto } from './recipe-input.dto';
import { RecipeQueryDto } from './recipe-query.dto';
import { RecipeListDto } from './recipe-response.dto';
import { RecipesRepository } from './recipes.repository';

@Injectable()
export class RecipesService {
  constructor(private readonly recipes: RecipesRepository) {}

  async list(query: RecipeQueryDto): Promise<RecipeListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search || undefined;
    const escapedSearch = search?.replace(/[\\%_]/g, (character) => `\\${character}`);
    const where: Prisma.RecipeWhereInput = escapedSearch ? {
      OR: [
        { title: { contains: escapedSearch, mode: 'insensitive' } },
        { description: { contains: escapedSearch, mode: 'insensitive' } },
      ],
    } : {};
    const [total, items] = await Promise.all([
      this.recipes.count(where),
      this.recipes.list(where, page, limit),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Recipe> {
    const recipe = await this.recipes.findById(id);
    if (!recipe) throw new NotFoundException('Рецепт не найден');
    return recipe;
  }

  create(dto: CreateRecipeDto): Promise<Recipe> {
    return this.recipes.create(dto);
  }

  update(id: string, dto: UpdateRecipeDto): Promise<Recipe> {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('PATCH body must contain at least one field');
    }
    return this.recipes.update(id, dto);
  }

  delete(id: string): Promise<void> {
    return this.recipes.delete(id);
  }
}
