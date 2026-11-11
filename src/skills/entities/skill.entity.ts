import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  images!: string[];

  @ManyToOne(() => User, (user) => user.skills, { nullable: false })
  owner!: User;

  @ManyToOne(() => Category, (category) => category.skills, {
    nullable: true,
  })
  category!: Category | null;

  @ManyToMany(() => User, (user) => user.favoriteSkills)
  favoritedBy!: User[];
}
