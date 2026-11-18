import { Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { jwtConfig, type TJwtConfig } from '../config/jwt.config';
import { type JwtPayload } from '../auth/auth.types';

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: TJwtConfig,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);

      if (!token) {
        throw new Error('Токен не передан');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.accessTokenSecret,
      });

      const data = client.data as { userId: number };
      data.userId = payload.sub;
      await client.join(this.userRoom(payload.sub));
      this.logger.log(
        `Клиент ${client.id} подключён к пользователю ${payload.sub}`,
      );
    } catch {
      this.logger.warn(`Отказ в подключении клиенту ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const data = client.data as { userId?: number };
    this.logger.log(
      `Клиент ${client.id} отключён (пользователь ${data.userId ?? 'неизвестен'})`,
    );
  }

  emitToUser(userId: number, event: string, data: unknown): void {
    this.server.to(this.userRoom(userId)).emit(event, data);
  }

  private userRoom(userId: number): string {
    return `user:${userId}`;
  }

  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake.auth as { token?: unknown } | undefined;
    const authToken = auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const query = client.handshake.query as { token?: unknown };
    const queryToken = query?.token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }

    return undefined;
  }
}
