import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../users/users.enums';
import type { JwtPayload } from '../auth/auth.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateRequestDto } from './dto/update-request.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from './request.enums';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,

    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    createRequestDto: CreateRequestDto,
    senderId: number,
  ): Promise<Request> {
    const sender = await this.usersRepository.findOneBy({ id: senderId });

    if (!sender) {
      throw new NotFoundException('Пользователь не найден');
    }

    const [offeredSkill, requestedSkill] = await Promise.all([
      this.skillsRepository.findOne({
        where: { id: createRequestDto.offeredSkillId },
        relations: { owner: true },
      }),
      this.skillsRepository.findOne({
        where: { id: createRequestDto.requestedSkillId },
        relations: { owner: true },
      }),
    ]);

    if (!offeredSkill) {
      throw new NotFoundException('Предлагаемый навык не найден');
    }

    if (!requestedSkill) {
      throw new NotFoundException('Запрашиваемый навык не найден');
    }

    if (offeredSkill.owner?.id !== senderId) {
      throw new ForbiddenException('Предлагать можно только свой навык');
    }

    const receiver = requestedSkill.owner;

    if (!receiver) {
      throw new NotFoundException('Владелец запрашиваемого навыка не найден');
    }

    if (receiver.id === senderId) {
      throw new BadRequestException('Нельзя отправить заявку самому себе');
    }

    const request = this.requestsRepository.create({
      sender,
      receiver,
      offeredSkill,
      requestedSkill,
      status: RequestStatus.PENDING,
      isRead: false,
    });

    return this.requestsRepository.save(request);
  }

  async findOutgoing(senderId: number): Promise<Request[]> {
    return this.requestsRepository.find({
      where: { sender: { id: senderId } },
      relations: {
        receiver: true,
        offeredSkill: { owner: true },
        requestedSkill: { owner: true },
      },
      order: { createdAt: 'DESC' },
    });
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

  findOne(id: number) {
    return `This action returns a #${id} request`;
  }

  update(id: number, updateRequestDto: UpdateRequestDto) {
    return `This action updates a #${id} request`;
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
