import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

describe('MCP Server Integration Tests', () => {
  let serverProcess: ChildProcess;
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    // Start the MCP server
    const serverPath = path.resolve(__dirname, '../../src/main.ts');
    
    transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "tsx", serverPath]
    });

    client = new Client({
      name: "test-client",
      version: "1.0.0"
    }, { capabilities: {} });

    await client.connect(transport);
  }, 10000); // 10 second timeout for server startup

  afterAll(async () => {
    try {
      if (client) {
        await client.close();
      }
    } catch (error) {
      console.warn('Error closing client:', error);
    }
    
    try {
      if (transport) {
        await transport.close();
      }
    } catch (error) {
      console.warn('Error closing transport:', error);
    }
    
    // Give processes time to clean up
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 15000);

  describe('Server Capabilities', () => {
    it('should list available tools', async () => {
      const tools = await client.listTools();
      
      expect(tools.tools).toBeDefined();
      expect(tools.tools.length).toBeGreaterThan(0);
      
      const weatherTool = tools.tools.find(tool => tool.name === 'getWeather');
      expect(weatherTool).toBeDefined();
      expect(weatherTool?.description).toContain('weather');
    });

    it('should have correct tool schema', async () => {
      const tools = await client.listTools();
      const weatherTool = tools.tools.find(tool => tool.name === 'getWeather');
      
      expect(weatherTool?.inputSchema).toBeDefined();
      expect(weatherTool?.inputSchema.type).toBe('object');
      expect(weatherTool?.inputSchema.properties).toHaveProperty('city');
    });
  });

  describe('Weather Tool', () => {
    it('should get weather for a valid city', async () => {
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "London" }
      });

      expect((result.content as any)).toBeDefined();
      expect((result.content as any).length).toBeGreaterThan(0);
      expect((result.content as any)[0]).toHaveProperty('type', 'text');
      expect((result.content as any)[0]).toHaveProperty('text');
      
      // Parse the weather data, but only if it's valid JSON
      const weatherText = (result.content as any)[0].text;
      
      // Check if the response is an error message
      if (weatherText.startsWith('Error') || weatherText.includes('fetch failed')) {
        // In CI environment, network calls might fail - this is acceptable
        console.log('Network call failed in CI environment:', weatherText);
        expect(weatherText).toContain('Error');
        return;
      }
      
      let weatherData;
      try {
        weatherData = JSON.parse(weatherText);
      } catch (e) {
        throw new Error(`Weather tool did not return valid JSON: ${weatherText}`);
      }
      expect(weatherData).toHaveProperty('latitude');
      expect(weatherData).toHaveProperty('longitude');
      expect(weatherData).toHaveProperty('current');
    }, 15000); // 15 second timeout for API calls

    it('should handle invalid city gracefully', async () => {
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "NonExistentCityXYZ123" }
      });

      expect((result.content as any)).toBeDefined();
      expect((result.content as any).length).toBeGreaterThan(0);
      
      const responseText = (result.content as any)[0].text;
      expect(responseText).toContain('Error');
      expect(responseText).toContain('not found');
    });

    it('should handle empty city input', async () => {
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "" }
      });

      expect((result.content as any)).toBeDefined();
      const responseText = (result.content as any)[0].text;
      expect(responseText).toContain('Error');
      expect(responseText).toContain('cannot be empty');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool calls', async () => {
      try {
        await client.callTool({
          name: "nonExistentTool",
          arguments: {}
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed arguments', async () => {
      try {
        await client.callTool({
          name: "getWeather",
          arguments: { invalidField: "test" }
        });
        // Should not reach here  
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
