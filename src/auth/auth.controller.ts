import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: { username: string; password: string }) {
    await this.authService.register(body.username, body.password);

    return { success: true };
  }

  @Post('signin')
  @UseGuards(AuthGuard('local'))
  signin(@Req() req: Request) {
    const user = req.user as User;

    return this.authService.issueJwt({
      sub: user.id,
      username: user.username,
      authLevel: 'password',
      passkeyVerified: false,
    });
  }
}
