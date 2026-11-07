import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({ imports: [AuthModule, HealthModule, RecipesModule] })
export class AppModule {}
