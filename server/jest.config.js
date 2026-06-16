/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/services/trending.service.ts',
    'src/controllers/trending.controller.ts',
  ],
  coverageReporters: ['text', 'lcov'],
};
