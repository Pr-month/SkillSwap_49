import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
  })
  password!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  about!: string | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  birthdate!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  city!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  gender!: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  avatar!: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  refreshToken!: string | null;
}
