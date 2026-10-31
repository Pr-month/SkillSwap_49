import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Skill } from '../../skills/entities/skill.entity';

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.requestsSent, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  sender!: User;

  @ManyToOne(() => User, (user) => user.requestsReceived, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  recipient!: User;

  @ManyToOne(() => Skill, (skill) => skill.requests, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  skill!: Skill;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status!: RequestStatus;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}