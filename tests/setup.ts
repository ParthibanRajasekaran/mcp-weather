
import { setupGlobalFetchMock } from './__mocks__/fetch.js';

// Global test setup
setupGlobalFetchMock();

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Ensure all timers are cleared
  jest.clearAllTimers();
  
  // Reset all mocks
  jest.resetAllMocks();
});
