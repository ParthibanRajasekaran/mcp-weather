export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js'
  },
  tsconfigFile: 'tsconfig.json',
  coverageAnalysis: 'off',
  mutate: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts'  // Exclude main.ts as it's mostly a bootstrap file
  ],
  // Exclude test files and setup files
  ignore: [
    'tests/**',
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/node_modules/**'
  ]
};
