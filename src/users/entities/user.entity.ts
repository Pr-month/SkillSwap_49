import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UserGender, UserRole } from '../users.enums';
import { Exclude } from 'class-transformer';
import { Skill } from '../../skills/entities/skill.entity';
import { Category } from '../../categories/entities/category.entity';
import { Request as SkillRequest } from '../../requests/entities/request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'text', nullable: true })
  about!: string | null;

  @Column({ type: 'date', nullable: true })
  birthdate!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  gender!: UserGender | null;

  @Column({ type: 'varchar', nullable: true })
  avatar!: string | null;

  @OneToMany(() => Skill, (skill) => skill.owner)
  skills!: Skill[];

  @OneToMany(() => SkillRequest, (request) => request.sender)
  requestsSent!: SkillRequest[];

  @OneToMany(() => SkillRequest, (request) => request.recipient)
  requestsReceived!: SkillRequest[];

  @ManyToMany(() => Category, (category) => category.interestedUsers)
  @JoinTable({
    name: 'user_want_to_learn',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'categoryId',
      referencedColumnName: 'id',
    },
  })
  wantToLearn!: Category[];

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', nullable: true })
  refreshToken!: string | null;
}
