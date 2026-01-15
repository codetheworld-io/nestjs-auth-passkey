import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: string;
  username: string;
  authLevel: 'password' | 'full';
  passkeyVerified?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const existing = await this.userService.findByUsername(username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await this.passwordService.hash(password);

    return this.userService.create(username, passwordHash);
  }

  issueJwt(payload: JwtPayload) {
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
