import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorDto } from '../common/api-error.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

export function AdminOnly(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    Roles(Role.admin),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ type: ApiErrorDto, description: 'Требуется действительный Bearer-токен' }),
    ApiForbiddenResponse({ type: ApiErrorDto, description: 'Требуется роль admin' }),
  );
}
