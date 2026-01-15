import { Module } from '@nestjs/common';
import { PasskeysService } from './passkeys.service';
import { PasskeysController } from './passkeys.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasskeyCredential } from './passkey-credential.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { PasswordService } from '../auth/password.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasskeyCredential]),
    CacheModule.register({ ttl: 60 }),
  ],
  providers: [UsersService, PasswordService, PasskeysService, AuthService],
  controllers: [PasskeysController],
})
export class PasskeysModule {}
