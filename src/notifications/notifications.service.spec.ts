import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './notification.enums';
import { RequestStatus } from '../requests/request.enums';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let gateway: { emitToUser: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    gateway = { emitToUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: repository,
        },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  function stubSave(): void {
    repository.create.mockImplementation((data: Partial<Notification>) => data);
    repository.save.mockImplementation((data: Partial<Notification>) =>
      Promise.resolve({
        id: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        ...data,
      }),
    );
  }

  describe('notifyRequestReceived', () => {
    it('persists a REQUEST_RECEIVED notification and emits it', async () => {
      stubSave();

      await service.notifyRequestReceived(20, 'Анна', 5);

      expect(repository.create).toHaveBeenCalledWith({
        recipient: { id: 20 },
        type: NotificationType.REQUEST_RECEIVED,
        message: 'Пользователь Анна отправил вам заявку на обмен',
        requestId: 5,
      });
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        20,
        'notification',
        expect.objectContaining({ type: NotificationType.REQUEST_RECEIVED }),
      );
    });
  });

  describe('notifyRequestUpdated', () => {
    it('persists a REQUEST_UPDATED notification and emits it', async () => {
      stubSave();

      await service.notifyRequestUpdated(10, 5, RequestStatus.ACCEPT);

      expect(repository.create).toHaveBeenCalledWith({
        recipient: { id: 10 },
        type: NotificationType.REQUEST_UPDATED,
        message: 'Статус вашей заявки изменён на "accepted"',
        requestId: 5,
      });
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        10,
        'notification',
        expect.objectContaining({ type: NotificationType.REQUEST_UPDATED }),
      );
    });
  });

  describe('findForUser', () => {
    it('returns notifications for the user ordered by createdAt desc', async () => {
      const notifications = [{ id: 1 }];
      repository.find.mockResolvedValue(notifications);

      const result = await service.findForUser(10);

      expect(repository.find).toHaveBeenCalledWith({
        where: { recipient: { id: 10 } },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(notifications);
    });
  });

  describe('markAsRead', () => {
    it('marks the notification as read', async () => {
      const notification = { id: 1, isRead: false };
      repository.findOne.mockResolvedValue(notification);
      repository.save.mockResolvedValue(notification);

      await service.markAsRead(1, 10);

      expect(notification.isRead).toBe(true);
    });

    it('throws NotFoundException when the notification is missing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead(1, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
