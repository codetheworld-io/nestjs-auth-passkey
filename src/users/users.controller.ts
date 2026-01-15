import { Controller, UseGuards, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FullAuthGuard } from '../auth/full-auth.guard';

@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @UseGuards(FullAuthGuard)
  @Get('histories')
  getHistories() {
    return { success: true };
  }
}
