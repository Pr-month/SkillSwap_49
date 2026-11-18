import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': '@swc/jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs/typeorm|@nestjs/jwt|@nestjs/config|@nestjs/passport|@nestjs/mapped-types|@nestjs/throttler|@nestjs/websockets|@nestjs/platform-socket.io)/)',
  ],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    '^@nestjs/typeorm$': '<rootDir>/test/mocks/typeorm.mock.ts',
    '^@nestjs/passport$': '<rootDir>/test/mocks/passport.mock.ts',
    '^@nestjs/mapped-types$': '<rootDir>/test/mocks/mapped-types.mock.ts',
  },
};
