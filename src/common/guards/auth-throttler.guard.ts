import { Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import {
  throttleConfig,
  type TThrottleConfig,
} from '../../config/throttle.config';

/**
 * Строгий лимит частоты запросов для эндпоинтов аутентификации.
 * Лимит и окно задаются через переменные окружения AUTH_THROTTLE_LIMIT и
 * AUTH_THROTTLE_TTL (см. throttle.config.ts).
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    @Inject(throttleConfig.KEY)
    private readonly config: TThrottleConfig,
  ) {
    super(options, storageService, reflector);
  }

  async onModuleInit(): Promise<void> {
    await super.onModuleInit();

    this.throttlers = [
      {
        name: 'auth',
        ttl: this.config.authTtl,
        limit: this.config.authLimit,
      },
    ];
  }
}
