export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        moduleResolution: 'node'
      }
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts', // Exclude main entry point
    '!**/*.d.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Improved resource management for CI
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: process.env.CI ? 2 : '50%',
  testTimeout: 60000, // Increased global timeout for CI
  // Specific timeouts for different test types
  testPathIgnorePatterns: [],
  globalTeardown: undefined,
  globalSetup: undefined
};
