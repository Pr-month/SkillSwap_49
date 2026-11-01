import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { type Request } from 'express';
import { Strategy } from 'passport-jwt';
import { jwtConfig, type TJwtConfig } from '../../config/jwt.config';
import { type JwtPayload, type RefreshJwtPayload } from '../auth.types';

const REFRESH_TOKEN_COOKIE = 'REFRESH_TOKEN';

const extractRefreshToken = (request: Request): string | null => {
  const cookies = request.cookies as Record<string, unknown> | undefined;
  const refreshToken = cookies?.[REFRESH_TOKEN_COOKIE];

  return typeof refreshToken === 'string' ? refreshToken : null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: TJwtConfig,
  ) {
    if (!config.refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET не обнаружен');
    }

    super({
      jwtFromRequest: extractRefreshToken,
      ignoreExpiration: false,
      secretOrKey: config.refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: JwtPayload): RefreshJwtPayload {
    const refreshToken = extractRefreshToken(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Отсутствует токен обновления');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
