import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from './auth.service';

@Injectable()
export class FullAuthGuard extends JwtAuthGuard {
  override handleRequest<T extends JwtPayload>(err: Error, payload: T) {
    if (err || !payload) {
      throw err || new UnauthorizedException();
    }

    if (payload.authLevel !== 'full') {
      throw new ForbiddenException('Passkey verification required');
    }

    return payload;
  }
}
