import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../users/users.enums';
import type { JwtPayload } from '../auth/auth.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { Request } from './entities/request.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
  ) {}

  create(createRequestDto: CreateRequestDto) {
    return 'This action adds a new request';
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
