import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './notification.enums';
import { NotificationsGateway } from './notifications.gateway';
import { RequestStatus } from '../requests/request.enums';

export interface NotificationPayload {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  requestId: number | null;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async notifyRequestReceived(
    recipientId: number,
    senderName: string,
    requestId: number,
  ): Promise<Notification> {
    return this.create(
      recipientId,
      NotificationType.REQUEST_RECEIVED,
      `Пользователь ${senderName} отправил вам заявку на обмен`,
      requestId,
    );
  }

  async notifyRequestUpdated(
    recipientId: number,
    requestId: number,
    status: RequestStatus,
  ): Promise<Notification> {
    return this.create(
      recipientId,
      NotificationType.REQUEST_UPDATED,
      `Статус вашей заявки изменён на "${status}"`,
      requestId,
    );
  }

  findForUser(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { recipient: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, recipient: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  private async create(
    recipientId: number,
    type: NotificationType,
    message: string,
    requestId: number | null,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      recipient: { id: recipientId },
      type,
      message,
      requestId,
    });

    const saved = await this.notificationsRepository.save(notification);
    this.gateway.emitToUser(recipientId, 'notification', this.toPayload(saved));

    return saved;
  }

  private toPayload(notification: Notification): NotificationPayload {
    return {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      requestId: notification.requestId,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
