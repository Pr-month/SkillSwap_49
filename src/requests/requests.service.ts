import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '../users/users.enums';
import type { JwtPayload } from '../auth/auth.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from './request.enums';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createRequestDto: CreateRequestDto,
    senderId: number,
  ): Promise<Request> {
    const sender = await this.usersRepository.findOneBy({ id: senderId });

    if (!sender) {
      throw new NotFoundException('Пользователь не найден');
    }

    const offeredSkill = await this.skillsRepository.findOneBy({
      id: createRequestDto.offeredSkillId,
    });

    if (!offeredSkill) {
      throw new NotFoundException('Предлагаемый навык не найден');
    }

    const requestedSkill = await this.skillsRepository.findOne({
      where: { id: createRequestDto.requestedSkillId },
      relations: { owner: true },
    });

    if (!requestedSkill) {
      throw new NotFoundException('Запрашиваемый навык не найден');
    }

    const receiver = requestedSkill.owner;

    if (receiver.id === senderId) {
      throw new BadRequestException('Нельзя отправить заявку самому себе');
    }

    const request = this.requestsRepository.create({
      sender,
      receiver,
      offeredSkill,
      requestedSkill,
      status: RequestStatus.PENDING,
    });

    const saved = await this.requestsRepository.save(request);

    await this.notificationsService.notifyRequestReceived(
      receiver.id,
      sender.name,
      saved.id,
    );

    return saved;
  }

  findAll() {
    return `This action returns all requests`;
  }

  async findIncoming(userId: number): Promise<Request[]> {
    return this.requestsRepository.find({
      where: { receiver: { id: userId } },
      relations: {
        sender: true,
        receiver: true,
        offeredSkill: true,
        requestedSkill: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOutgoing(userId: number): Promise<Request[]> {
    return this.requestsRepository.find({
      where: { sender: { id: userId } },
      relations: {
        sender: true,
        receiver: true,
        offeredSkill: true,
        requestedSkill: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} request`;
  }

  async update(
    id: number,
    updateRequestDto: UpdateRequestDto,
    userId: number,
  ): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: { sender: true, receiver: true },
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.receiver.id !== userId) {
      throw new ForbiddenException('Обновлять можно только входящие заявки');
    }

    request.status = updateRequestDto.status;
    const saved = await this.requestsRepository.save(request);

    await this.notificationsService.notifyRequestUpdated(
      request.sender.id,
      saved.id,
      saved.status,
    );

    return saved;
  }

  async remove(id: number, user: JwtPayload): Promise<void> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: { sender: true },
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.sender.id !== user.sub && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет прав на удаление заявки');
    }

    await this.requestsRepository.delete(id);
  }
}
