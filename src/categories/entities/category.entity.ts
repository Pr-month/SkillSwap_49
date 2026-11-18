import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { User } from '../../users/entities/user.entity';
import type { Relation } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  parent!: Relation<Category> | null;

  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];

  @OneToMany(() => Skill, (skill) => skill.category)
  skills!: Skill[];

  @ManyToMany(() => User, (user) => user.wantToLearn)
  interestedUsers!: User[];
}
