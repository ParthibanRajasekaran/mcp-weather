import { getAllTools } from '../../src/utils/registry.js';

// Mock the serviceRegistry for isolated testing
jest.mock('../../src/utils/registry.js', () => {
  const original = jest.requireActual('../../src/utils/registry.js');
  return {
    ...original,
    serviceRegistry: {
      weather: [
        {
          name: 'getWeather',
          description: 'Get weather',
          inputSchema: { city: 'string' },
          handler: jest.fn(async () => 'Weather data')
        }
      ]
    }
  };
});

describe('utils/registry', () => {
  it('should return all registered tools', () => {
    const tools = getAllTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
    expect(tools[0]).toHaveProperty('name', 'getWeather');
  });

  it('should return an empty array if no tools are registered', () => {
    jest.resetModules();
    jest.doMock('../../src/utils/registry.js', () => ({
      serviceRegistry: {},
      getAllTools: () => []
    }));
    const { getAllTools: getAllToolsEmpty } = require('../../src/utils/registry.js');
    expect(getAllToolsEmpty()).toEqual([]);
  });

  it('should handle tool handler errors gracefully', async () => {
    jest.resetModules();
    jest.doMock('../../src/utils/registry.js', () => ({
      serviceRegistry: {
        weather: [
          {
            name: 'brokenTool',
            description: 'Broken',
            inputSchema: {},
            handler: async () => { throw new Error('fail'); }
          }
        ]
      },
      getAllTools: () => [
        {
          name: 'brokenTool',
          description: 'Broken',
          inputSchema: {},
          handler: async () => { throw new Error('fail'); }
        }
      ]
    }));
    const { getAllTools: getAllToolsBroken } = require('../../src/utils/registry.js');
    const tools = getAllToolsBroken();
    expect(tools[0].name).toBe('brokenTool');
    await expect(tools[0].handler()).rejects.toThrow('fail');
  });
});
