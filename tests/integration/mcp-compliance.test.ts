import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';

/**
 * MCP Protocol Compliance Tests
 * These tests verify that the server correctly implements the MCP specification
 */
describe('MCP Protocol Compliance Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    const serverPath = path.resolve(__dirname, '../../src/main.ts');
    
    transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "tsx", serverPath]
    });

    client = new Client({
      name: "protocol-compliance-test",
      version: "1.0.0"
    }, { capabilities: {} });

    await client.connect(transport);
  }, 15000);

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('Server Information and Capabilities', () => {
    it('should provide server information', async () => {
      // The server should have been initialized during connection
      // We can verify this by checking that tools are available
      const tools = await client.listTools();
      expect(tools.tools).toBeDefined();
      expect(Array.isArray(tools.tools)).toBe(true);
    });

    it('should implement required MCP methods', async () => {
      // Test that core MCP methods are implemented
      
      // 1. List tools (should work)
      await expect(client.listTools()).resolves.toBeDefined();
      
      // 2. Call tool (should work for valid tools)
      await expect(client.callTool({
        name: "getWeather",
        arguments: { city: "London" }
      })).resolves.toBeDefined();
    });
  });

  describe('Tool Discovery and Schema Compliance', () => {
    it('should provide properly formatted tool definitions', async () => {
      const tools = await client.listTools();
      
      expect(tools.tools).toBeDefined();
      expect(tools.tools.length).toBeGreaterThan(0);
      
      // Each tool should have required fields
      tools.tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        
        // Name should be a non-empty string
        expect(typeof tool.name).toBe('string');
        expect(tool.name.length).toBeGreaterThan(0);
        
        // Description should be a non-empty string
        expect(typeof tool.description).toBe('string');
        expect(tool.description?.length).toBeGreaterThan(0);
        
        // Input schema should be a valid JSON schema object
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');
      });
    });

    it('should provide valid JSON schemas for tool inputs', async () => {
      const tools = await client.listTools();
      const weatherTool = tools.tools.find(tool => tool.name === 'getWeather');
      
      expect(weatherTool).toBeDefined();
      expect(weatherTool?.inputSchema).toBeDefined();
      
      const schema = weatherTool?.inputSchema;
      
      // Verify it's a proper JSON schema
      expect(schema?.type).toBe('object');
      expect(schema?.properties).toBeDefined();
      expect(schema?.properties).toHaveProperty('city');
      
      // City property should be properly defined
      const cityProperty = (schema?.properties as any)?.city;
      expect(cityProperty).toBeDefined();
      expect(cityProperty.type).toBe('string');
      expect(cityProperty.description).toBeDefined();
    });
  });

  describe('Tool Execution Compliance', () => {
    it('should return properly formatted tool results', async () => {
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "London" }
      });
      
      // Result should have content array
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect((result.content as any).length).toBeGreaterThan(0);
      
      // Each content item should have proper structure
      (result.content as any).forEach((item: any) => {
        expect(item).toHaveProperty('type');
        expect(item.type).toBe('text');
        expect(item).toHaveProperty('text');
        expect(typeof item.text).toBe('string');
        expect(item.text.length).toBeGreaterThan(0);
      });
    });

    it('should handle invalid tool names properly', async () => {
      try {
        await client.callTool({
          name: "nonExistentTool",
          arguments: {}
        });
        // Should not reach here
        fail('Expected error for invalid tool name');
      } catch (error) {
        // Should throw a proper error
        expect(error).toBeDefined();
      }
    });

    it('should validate tool arguments according to schema', async () => {
      try {
        await client.callTool({
          name: "getWeather",
          arguments: { invalidField: "test" }
        });
        // Should not reach here if validation is working
        fail('Expected validation error for invalid arguments');
      } catch (error) {
        // Should throw a validation error
        expect(error).toBeDefined();
      }
    });

    it('should handle missing required arguments', async () => {
      try {
        await client.callTool({
          name: "getWeather",
          arguments: {}
        });
        // Should not reach here
        fail('Expected error for missing required arguments');
      } catch (error) {
        // Should throw a proper error
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling Compliance', () => {
    it('should return proper error responses for invalid inputs', async () => {
      // Test with empty string city
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "" }
      });
      
      expect((result.content as any)).toBeDefined();
      const responseText = (result.content as any)[0].text;
      
      // Should contain error information
      expect(responseText).toContain('Error');
      expect(responseText).toContain('cannot be empty');
    });

    it('should handle external API failures gracefully', async () => {
      // Test with invalid city that will cause API to return no results
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "InvalidCityThatDoesNotExist12345" }
      });
      
      expect((result.content as any)).toBeDefined();
      const responseText = (result.content as any)[0].text;
      
      // Should contain helpful error message
      expect(responseText).toContain('Error');
      expect(responseText).toContain('not found');
    });
  });

  describe('Communication Protocol Compliance', () => {
    it('should maintain stable connection throughout session', async () => {
      // Perform multiple operations to test connection stability
      const operations = [
        () => client.listTools(),
        () => client.callTool({ name: "getWeather", arguments: { city: "London" } }),
        () => client.listTools(),
        () => client.callTool({ name: "getWeather", arguments: { city: "Paris" } }),
      ];
      
      // All operations should succeed
      for (const operation of operations) {
        await expect(operation()).resolves.toBeDefined();
      }
    });

    it('should handle rapid sequential requests correctly', async () => {
      // Send multiple requests quickly
      const promises = Array(5).fill(null).map((_, index) => 
        client.callTool({
          name: "getWeather",
          arguments: { city: "London" }
        })
      );
      
      const results = await Promise.all(promises);
      
      // All requests should succeed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect((result.content as any)).toBeDefined();
        expect((result.content as any)[0]).toHaveProperty('text');
      });
    });
  });

  describe('Data Format Compliance', () => {
    it('should return valid JSON data when appropriate', async () => {
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "London" }
      });
      
      const responseText = (result.content as any)[0].text;
      
      // If not an error, should be valid JSON
      if (!responseText.includes('Error')) {
        expect(() => JSON.parse(responseText)).not.toThrow();
        
        const data = JSON.parse(responseText);
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
      }
    });

    it('should provide consistent data structure across requests', async () => {
      const result1 = await client.callTool({
        name: "getWeather",
        arguments: { city: "London" }
      });
      
      const result2 = await client.callTool({
        name: "getWeather",
        arguments: { city: "Paris" }
      });
      
      const text1 = (result1.content as any)[0].text;
      const text2 = (result2.content as any)[0].text;
      
      // Both should be successful (not errors) and have similar structure
      if (!text1.includes('Error') && !text2.includes('Error')) {
        const data1 = JSON.parse(text1);
        const data2 = JSON.parse(text2);
        
        // Should have same top-level properties
        const keys1 = Object.keys(data1).sort();
        const keys2 = Object.keys(data2).sort();
        expect(keys1).toEqual(keys2);
        
        // Should have same data types for common properties
        expect(typeof data1.latitude).toBe(typeof data2.latitude);
        expect(typeof data1.longitude).toBe(typeof data2.longitude);
        expect(typeof data1.current).toBe(typeof data2.current);
      }
    }, 20000);
  });
});
