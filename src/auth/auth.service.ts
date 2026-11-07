import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { isUUID } from 'class-validator';
import { readConfig } from '../config';
import { LoginDto, LoginResponseDto } from './login.dto';
import { UsersRepository } from './users.repository';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly config = readConfig();

  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !await compare(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const accessToken = await this.jwt.signAsync(
      { sub: user.id },
      { secret: this.config.jwtSecret, algorithm: 'HS256', expiresIn: this.config.jwtExpiresIn },
    );
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.jwtExpiresIn,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async authenticate(token: string): Promise<AuthenticatedUser> {
    let payload: { sub?: unknown; iat?: unknown; exp?: unknown };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.jwtSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException();
    }
    if (typeof payload.sub !== 'string' || !isUUID(payload.sub)
      || typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
      throw new UnauthorizedException();
    }
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
