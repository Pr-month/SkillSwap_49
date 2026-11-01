import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRequestDto } from './dto/create-request.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from './requests.enums';
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

    const receiver = requestedSkill.owner;

    if (!receiver) {
      throw new NotFoundException('Владелец запрашиваемого навыка не найден');
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
}
