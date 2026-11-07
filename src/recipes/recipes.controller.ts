import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param,
  Patch, Post, Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiCreatedResponse, ApiInternalServerErrorResponse,
  ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation,
  ApiParam, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '../auth/admin-only.decorator';
import { ApiErrorDto } from '../common/api-error.dto';
import { UuidPipe } from '../common/uuid.pipe';
import { CreateRecipeDto, UpdateRecipeDto } from './recipe-input.dto';
import { RecipeQueryDto } from './recipe-query.dto';
import { RecipeDto, RecipeListDto } from './recipe-response.dto';
import { RecipesService } from './recipes.service';

@ApiTags('recipes')
@ApiBadRequestResponse({ type: ApiErrorDto })
@ApiInternalServerErrorResponse({ type: ApiErrorDto })
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'Публичный список рецептов' })
  @ApiQuery({ name: 'page', required: false, type: 'integer', minimum: 1, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'integer', minimum: 1, maximum: 100, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, maxLength: 200 })
  @ApiOkResponse({ type: RecipeListDto })
  list(@Query() query: RecipeQueryDto): Promise<RecipeListDto> {
    return this.recipes.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Публичные детали рецепта' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RecipeDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  findById(@Param('id', UuidPipe) id: string): Promise<RecipeDto> {
    return this.recipes.findById(id);
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Создать рецепт' })
  @ApiCreatedResponse({ type: RecipeDto })
  create(@Body() dto: CreateRecipeDto): Promise<RecipeDto> {
    return this.recipes.create(dto);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Изменить рецепт' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RecipeDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  update(
    @Param('id', UuidPipe) id: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeDto> {
    return this.recipes.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить рецепт' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Рецепт удалён' })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  delete(@Param('id', UuidPipe) id: string): Promise<void> {
    return this.recipes.delete(id);
  }
}
