export default {
  mutator: 'typescript',
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    config: {
      preset: 'ts-jest/presets/default-esm',
      extensionsToTreatAsEsm: ['.ts'],
      testEnvironment: 'node',
      roots: ['<rootDir>/src', '<rootDir>/tests'],
      testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts'
      ],
      transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/main.ts',
        '!**/*.d.ts'
      ],
      coverageReporters: ['text', 'lcov', 'html'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    },
    enableFindRelatedTests: true
  },
  tsconfigFile: 'tsconfig.json',
  coverageAnalysis: 'off',
  mutate: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ]
};
