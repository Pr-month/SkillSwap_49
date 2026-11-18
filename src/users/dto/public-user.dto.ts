import { calculateAge } from '../../common/utils/calculate-age';
import { User } from '../entities/user.entity';

export class PublicUserDto {
  id: number;
  name: string;
  about: string | null;
  city: string | null;
  avatar: string | null;
  age: number | null;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.about = user.about;
    this.city = user.city;
    this.avatar = user.avatar;
    this.age = calculateAge(user.birthdate);
  }
}
