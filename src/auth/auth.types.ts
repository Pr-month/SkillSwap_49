import { UserRole } from '../users/users.enums';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

export type RefreshJwtPayload = JwtPayload & {
  refreshToken: string;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};
