import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/users.enums';

export const Roles = Reflector.createDecorator<UserRole[]>();
