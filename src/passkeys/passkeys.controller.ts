import { Controller, UseGuards, Post, Req, Body, Get } from '@nestjs/common';
import { PasskeysService } from './passkeys.service';
import { AuthService } from '../auth/auth.service';
import type { Request } from 'express';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('passkeys')
@UseGuards(JwtAuthGuard)
export class PasskeysController {
  constructor(
    private readonly passkeysService: PasskeysService,
    private readonly authService: AuthService,
  ) {}

  @Get('register/options')
  async getRegisterOptions(@Req() req: Request) {
    return this.passkeysService.generateRegistrationOptions(req.user!);
  }

  @Post('register/verify')
  async verifyRegister(
    @Req() req: Request,
    @Body() body: RegistrationResponseJSON & { deviceName?: string },
  ) {
    await this.passkeysService.verifyRegistration(req.user!, body);

    return { success: true };
  }

  @Get('auth/options')
  async getAuthOptions(@Req() req: Request) {
    return this.passkeysService.generateAuthOptions(req.user!);
  }

  @Post('auth/verify')
  async verifyAuth(
    @Req() req: Request,
    @Body() body: AuthenticationResponseJSON,
  ) {
    await this.passkeysService.verifyAuthentication(req.user!, body);

    return this.authService.issueJwt({
      sub: req.user!.sub,
      username: req.user!.username,
      authLevel: 'full',
      passkeyVerified: true,
    });
  }
}
