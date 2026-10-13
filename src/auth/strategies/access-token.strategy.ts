import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig, type TJwtConfig } from '../../config/jwt.config';
import { type JwtPayload } from '../auth.types';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access-token',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: TJwtConfig,
  ) {
    if (!config.accessTokenSecret) {
      throw new Error('JWT_ACCESS_SECRET не обнаружен');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessTokenSecret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
