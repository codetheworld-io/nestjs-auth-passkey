import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { PasskeyCredential } from './passkey-credential.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  RegistrationResponseJSON,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { JwtPayload } from '../auth/auth.service';

@Injectable()
export class PasskeysService {
  constructor(
    @InjectRepository(PasskeyCredential)
    private readonly passkeyCredentialRepository: Repository<PasskeyCredential>,

    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async generateRegistrationOptions(jwtPayload: JwtPayload) {
    const credentials = await this.passkeyCredentialRepository.find({
      where: { user: { id: jwtPayload.sub } },
    });

    const options = await generateRegistrationOptions({
      rpName: process.env.RP_NAME as string,
      rpID: process.env.RP_ID as string,
      userID: new TextEncoder().encode(jwtPayload.sub),
      userName: jwtPayload.username,
      userDisplayName: jwtPayload.username,
      timeout: 60_000,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: credentials.map((c) => ({
        id: isoBase64URL.fromBuffer(c.credentialId),
        type: 'public-key',
      })),
    });

    await this.cache.set(
      `passkey-reg:${jwtPayload.sub}`,
      options.challenge,
      60_000,
    );

    return options;
  }

  async verifyRegistration(
    jwtPayload: JwtPayload,
    response: RegistrationResponseJSON & { deviceName?: string },
  ): Promise<boolean> {
    const expectedChallenge = await this.cache.get<string>(
      `passkey-reg:${jwtPayload.sub}`,
    );

    if (!expectedChallenge) {
      throw new BadRequestException('Challenge expired');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: process.env.RP_ORIGIN as string,
      expectedRPID: process.env.RP_ID as string,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException();
    }

    const { credential } = verification.registrationInfo;

    const exists = await this.passkeyCredentialRepository.findOne({
      where: { credentialId: isoBase64URL.toBuffer(credential.id) },
    });

    if (exists) {
      throw new ConflictException('Credential already exists');
    }

    const newPasskeyCredential = this.passkeyCredentialRepository.create({
      user: { id: jwtPayload.sub },
      credentialId: isoBase64URL.toBuffer(credential.id),
      publicKey: credential.publicKey,
      counter: credential.counter,
      deviceName: response.deviceName,
      transports: credential.transports ?? ['internal'],
    });

    await this.passkeyCredentialRepository.save(newPasskeyCredential);

    await this.cache.del(`passkey-reg:${jwtPayload.sub}`);

    return true;
  }

  async generateAuthOptions(jwtPayload: JwtPayload) {
    const credentials = await this.passkeyCredentialRepository.find({
      where: { user: { id: jwtPayload.sub } },
    });

    if (!credentials.length) {
      throw new BadRequestException('No passkeys registered');
    }

    const options = await generateAuthenticationOptions({
      timeout: 60_000,
      rpID: process.env.RP_ID as string,
      allowCredentials: credentials.map((c) => ({
        id: isoBase64URL.fromBuffer(c.credentialId),
        type: 'public-key',
        transports: c.transports,
      })),
      userVerification: 'preferred',
    });

    await this.cache.set(
      `passkey-auth:${jwtPayload.sub}`,
      options.challenge,
      60_000,
    );

    return options;
  }

  async verifyAuthentication(
    jwtPayload: JwtPayload,
    response: AuthenticationResponseJSON,
  ) {
    const challenge = await this.cache.get<string>(
      `passkey-auth:${jwtPayload.sub}`,
    );

    if (!challenge) {
      throw new BadRequestException('Challenge expired');
    }

    const credentialId = isoBase64URL.toBuffer(response.id);

    const credential = await this.passkeyCredentialRepository.findOne({
      where: { credentialId },
      relations: ['user'],
    });

    if (!credential || credential.user.id !== jwtPayload.sub) {
      throw new UnauthorizedException();
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: process.env.RP_ORIGIN as string,
      expectedRPID: process.env.RP_ID as string,
      credential: {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      throw new UnauthorizedException();
    }

    credential.counter = verification.authenticationInfo.newCounter;
    credential.lastUsedAt = new Date();

    await this.passkeyCredentialRepository.save(credential);

    await this.cache.del(`passkey-auth:${jwtPayload.sub}`);

    return true;
  }
}
