export function AuthGuard(): new () => unknown {
  return class AuthGuardMock {};
}

export function PassportStrategy(): new () => unknown {
  return class PassportStrategyMock {};
}

export const PassportModule = {
  register: () => ({ module: class {}, providers: [] }),
  registerAsync: () => ({ module: class {}, providers: [] }),
};
