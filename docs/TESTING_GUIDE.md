# Testing Guide for MCP Data Server

This guide covers the comprehensive testing strategy for the MCP Data Server, including unit tests, integration tests, and testing best practices.

## 🧪 Test Types

### 1. Unit Tests
Test individual components in isolation:
- **Service Tests**: Test weather service logic without external dependencies
- **Schema Tests**: Validate Zod schemas and type definitions
- **Utility Tests**: Test helper functions and utilities

### 2. Integration Tests
Test components working together:
- **MCP Protocol Tests**: Verify server compliance with MCP specification
- **API Integration Tests**: Test external API interactions
- **End-to-End Tests**: Full client-server communication

### 3. Performance Tests
- **Response Time Tests**: Ensure API calls complete within acceptable timeframes
- **Load Tests**: Test server behavior under multiple concurrent requests
- **Memory Tests**: Check for memory leaks in long-running processes

## 🚀 Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Only Integration Tests
```bash
npm run test:integration
```

## 📂 Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── services/                   # Service unit tests
│   └── weather.test.ts
├── types/                      # Schema and type tests
│   └── weather.test.ts
├── integration/                # Integration tests
│   └── mcp-server.test.ts
└── __mocks__/                  # Mock files
    └── fetch.ts
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses `ts-jest` for TypeScript support
- Configured for ES modules
- Includes coverage reporting
- Mock setup for external dependencies

### Coverage Targets
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## 📝 Writing Tests for New Services

When adding a new service, create tests following this pattern:

### 1. Unit Tests (`tests/services/myservice.test.ts`)

```typescript
import { MyService } from '../../src/services/myservice.js';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
    jest.clearAllMocks();
  });

  describe('getData', () => {
    it('should return data for valid input', async () => {
      // Mock external API
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      } as Response);

      const result = await service.getData({ query: 'test' });
      
      expect(result).toContain('test');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getData({ query: 'test' });
      
      expect(result).toContain('Error');
    });
  });
});
```

### 2. Schema Tests (`tests/types/myservice.test.ts`)

```typescript
import { MyServiceSchema } from '../../src/types/myservice.js';

describe('MyServiceSchema', () => {
  it('should validate correct input', () => {
    const result = MyServiceSchema.safeParse({ query: 'test' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid input', () => {
    const result = MyServiceSchema.safeParse({ invalid: 'field' });
    expect(result.success).toBe(false);
  });
});
```

### 3. Integration Tests

Add your service to the integration test suite:

```typescript
it('should list your new tool', async () => {
  const tools = await client.listTools();
  const myTool = tools.tools.find(tool => tool.name === 'myTool');
  expect(myTool).toBeDefined();
});

it('should call your tool successfully', async () => {
  const result = await client.callTool({
    name: "myTool",
    arguments: { query: "test" }
  });
  
  expect((result.content as any)).toBeDefined();
  // Add specific assertions for your service
});
```

## 🏃‍♂️ Continuous Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## 🎯 Test Best Practices

### 1. Arrange, Act, Assert Pattern
```typescript
it('should handle valid input', async () => {
  // Arrange
  const input = { city: 'London' };
  const mockResponse = { temperature: 15 };
  
  // Act
  const result = await service.getWeather(input);
  
  // Assert
  expect(result).toContain('15');
});
```

### 2. Mock External Dependencies
```typescript
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve(mockData)
} as Response);
```

### 3. Test Error Cases
```typescript
it('should handle network errors', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
  
  const result = await service.getData({ query: 'test' });
  
  expect(result).toContain('Error');
});
```

### 4. Use Descriptive Test Names
```typescript
// Good
it('should return weather data for a valid city')

// Bad  
it('should work')
```

### 5. Test Edge Cases
```typescript
describe('Edge Cases', () => {
  it('should handle empty string input', async () => {
    const result = await service.getData({ query: '' });
    expect(result).toContain('Error');
  });

  it('should handle very long input', async () => {
    const longQuery = 'a'.repeat(1000);
    const result = await service.getData({ query: longQuery });
    // Assert appropriate behavior
  });
});
```

## 🐛 Debugging Tests

### Run Specific Test File
```bash
npx jest tests/services/weather.test.ts
```

### Run Specific Test
```bash
npx jest -t "should return weather data"
```

### Debug Mode
```bash
npx jest --detectOpenHandles --forceExit
```

### Verbose Output
```bash
npx jest --verbose
```

## 📊 Coverage Reports

After running `npm run test:coverage`, check:
- **Terminal Output**: Summary of coverage percentages
- **HTML Report**: Open `coverage/lcov-report/index.html` in browser
- **LCOV File**: `coverage/lcov.info` for CI integration

## 🔄 Test-Driven Development (TDD)

When adding new features:

1. **Write the test first** (it should fail)
2. **Write minimal code** to make it pass
3. **Refactor** while keeping tests green
4. **Repeat** for each new feature

Example TDD cycle:
```typescript
// 1. Write failing test
it('should validate email addresses', () => {
  expect(validateEmail('test@example.com')).toBe(true);
});

// 2. Write minimal implementation
function validateEmail(email: string): boolean {
  return email.includes('@');
}

// 3. Refactor with proper validation
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

## 🚨 Common Testing Pitfalls

### 1. Testing Implementation Details
```typescript
// Bad - testing internal state
expect(service.internalCache).toBeDefined();

// Good - testing behavior
expect(await service.getData(input)).toContain('expected');
```

### 2. Overly Complex Tests
```typescript
// Bad - doing too much in one test
it('should handle all weather scenarios', async () => {
  // 50 lines of setup and assertions
});

// Good - focused tests
it('should handle sunny weather');
it('should handle rainy weather');
it('should handle snow weather');
```

### 3. Not Cleaning Up
```typescript
// Always clean up in beforeEach/afterEach
beforeEach(() => {
  jest.clearAllMocks();
});
```

This comprehensive testing setup ensures your MCP server is reliable, maintainable, and ready for production use! 🚀
