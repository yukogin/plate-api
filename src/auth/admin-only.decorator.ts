import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

export function AdminOnly(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    Roles(Role.admin),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Требуется действительный Bearer-токен' }),
    ApiForbiddenResponse({ description: 'Требуется роль admin' }),
  );
}
