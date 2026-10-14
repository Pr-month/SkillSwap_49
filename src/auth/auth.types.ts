export interface JwtPayload {
  sub: number;
}

export type RefreshJwtPayload = JwtPayload & {
  refreshToken: string;
};
