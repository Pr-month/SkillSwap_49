import { Inject } from '@nestjs/common';

export function getRepositoryToken(entity: {
  new (...args: unknown[]): unknown;
}): string {
  return `${entity.name}Repository`;
}

export function InjectRepository(entity: {
  new (...args: unknown[]): unknown;
}) {
  return Inject(getRepositoryToken(entity));
}
