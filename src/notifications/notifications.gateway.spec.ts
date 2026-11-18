import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';
import { NotificationsGateway } from './notifications.gateway';
import { UserRole } from '../users/users.enums';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: { verifyAsync: jest.Mock };

  const config = {
    accessTokenSecret: 'access-secret',
    refreshTokenSecret: 'refresh-secret',
    accessTokenExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
  };

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: jwtConfig.KEY, useValue: config },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  describe('emitToUser', () => {
    it('emits an event to the user room', () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      gateway.server = { to } as never;

      gateway.emitToUser(10, 'notification', { id: 1 });

      expect(to).toHaveBeenCalledWith('user:10');
      expect(emit).toHaveBeenCalledWith('notification', { id: 1 });
    });
  });

  describe('handleConnection', () => {
    function makeClient(handshake: Record<string, unknown>) {
      return {
        id: 'client-1',
        handshake,
        data: {},
        join: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
      };
    }

    it('joins the user room for a valid token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 10,
        email: 'a@b.c',
        role: UserRole.USER,
      });
      const client = makeClient({ auth: { token: 'valid-token' } });

      await gateway.handleConnection(client as never);

      expect(client.join).toHaveBeenCalledWith('user:10');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('disconnects the client for an invalid token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      const client = makeClient({ auth: { token: 'invalid-token' } });

      await gateway.handleConnection(client as never);

      expect(client.join).not.toHaveBeenCalled();
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('disconnects the client when no token is provided', async () => {
      const client = makeClient({ auth: {} });

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalled();
    });
  });
});
