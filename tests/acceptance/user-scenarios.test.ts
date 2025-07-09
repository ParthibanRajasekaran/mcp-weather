import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';

/**
 * Acceptance Tests - Testing from the user's perspective
 * These tests verify that the MCP server works correctly for real-world scenarios
 */
describe('MCP Server Acceptance Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    const serverPath = path.resolve(__dirname, '../../src/main.ts');
    
    transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "tsx", serverPath]
    });

    client = new Client({
      name: "acceptance-test-client",
      version: "1.0.0"
    }, { capabilities: {} });

    await client.connect(transport);
  }, 15000);

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('User Story: Getting Weather Information', () => {
    it('As a user, I want to get current weather for my city', async () => {
      // Given: I have a valid city name
      const cityName = 'London';
      
      // When: I request weather information
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: cityName }
      });

      // Then: I should receive comprehensive weather data
      expect((result.content as any)).toBeDefined();
      const weatherText = (result.content as any)[0].text;
      const weatherData = JSON.parse(weatherText);
      
      // Verify the response contains all expected fields
      expect(weatherData).toHaveProperty('latitude');
      expect(weatherData).toHaveProperty('longitude');
      expect(weatherData).toHaveProperty('current');
      expect(weatherData.current).toHaveProperty('temperature_2m');
      expect(weatherData.current).toHaveProperty('apparent_temperature');
      expect(weatherData).toHaveProperty('hourly');
      expect(weatherData.hourly).toHaveProperty('temperature_2m');
      
      // Verify data types are correct
      expect(typeof weatherData.latitude).toBe('number');
      expect(typeof weatherData.longitude).toBe('number');
      expect(typeof weatherData.current.temperature_2m).toBe('number');
      expect(Array.isArray(weatherData.hourly.temperature_2m)).toBe(true);
    }, 20000);

    it('As a user, I want helpful error messages for invalid cities', async () => {
      // Given: I have an invalid city name
      const invalidCity = 'InvalidCityThatDoesNotExist123';
      
      // When: I request weather information
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: invalidCity }
      });

      // Then: I should receive a helpful error message
      const responseText = (result.content as any)[0].text;
      expect(responseText).toContain('Error');
      expect(responseText).toContain('not found');
      // Security: Don't echo back potentially malicious user input
      expect(responseText).not.toContain(invalidCity);
    });

    it('As a user, I want to get weather for cities with special characters', async () => {
      // Given: I have a city name with special characters
      const cityWithSpecialChars = 'São Paulo';
      
      // When: I request weather information
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: cityWithSpecialChars }
      });

      // Then: The request should be handled correctly
      const weatherText = (result.content as any)[0].text;
      
      // Should either return weather data or a proper error (not a crash)
      expect(() => JSON.parse(weatherText)).not.toThrow();
    }, 20000);
  });

  describe('User Story: Service Discovery', () => {
    it('As a developer, I want to discover available tools', async () => {
      // When: I query for available tools
      const tools = await client.listTools();
      
      // Then: I should see the weather tool with proper documentation
      expect(tools.tools).toBeDefined();
      expect(tools.tools.length).toBeGreaterThan(0);
      
      const weatherTool = tools.tools.find(tool => tool.name === 'getWeather');
      expect(weatherTool).toBeDefined();
      expect(weatherTool?.description).toBeDefined();
      expect(weatherTool?.description?.length).toBeGreaterThan(0);
      expect(weatherTool?.inputSchema).toBeDefined();
      expect(weatherTool?.inputSchema.properties).toHaveProperty('city');
    });
  });

  describe('User Story: Real-world Usage Scenarios', () => {
    it('As a weather app developer, I want to get weather for multiple cities quickly', async () => {
      // Given: I have multiple cities to check
      const cities = ['London', 'Paris', 'Tokyo'];
      
      // When: I request weather for all cities
      const startTime = Date.now();
      const promises = cities.map(city => 
        client.callTool({
          name: "getWeather",
          arguments: { city }
        })
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // Then: All requests should succeed within reasonable time
      expect(results).toHaveLength(cities.length);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
      
      // All results should contain valid weather data
      results.forEach((result, index) => {
        const weatherText = (result.content as any)[0].text;
        expect(() => JSON.parse(weatherText)).not.toThrow();
        
        const weatherData = JSON.parse(weatherText);
        if (!weatherText.includes('Error')) {
          expect(weatherData).toHaveProperty('current');
          expect(weatherData.current).toHaveProperty('temperature_2m');
        }
      });
    }, 30000);

    it('As a user, I want consistent behavior across multiple requests', async () => {
      // Given: I make the same request multiple times
      const city = 'London';
      
      // When: I request weather data multiple times
      const requests = Array(3).fill(null).map(() => 
        client.callTool({
          name: "getWeather",
          arguments: { city }
        })
      );
      
      const results = await Promise.all(requests);
      
      // Then: All responses should have the same structure (though data may vary slightly)
      const parsedResults = results.map(result => {
        const weatherText = (result.content as any)[0].text;
        return JSON.parse(weatherText);
      });
      
      // All should have the same location
      const firstLocation = {
        latitude: parsedResults[0].latitude,
        longitude: parsedResults[0].longitude
      };
      
      parsedResults.forEach(data => {
        expect(data.latitude).toBeCloseTo(firstLocation.latitude, 2);
        expect(data.longitude).toBeCloseTo(firstLocation.longitude, 2);
        expect(data).toHaveProperty('current');
        expect(data).toHaveProperty('hourly');
      });
    }, 30000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle server errors gracefully', async () => {
      // This test ensures the server doesn't crash on edge cases
      const edgeCases = [
        { city: '' },
        { city: '   ' },
        { city: 'a'.repeat(1000) }, // Very long string
        { city: '123456' }, // Numeric string
        { city: '!@#$%^&*()' }, // Special characters only
      ];

      for (const testCase of edgeCases) {
        try {
          const result = await client.callTool({
            name: "getWeather",
            arguments: testCase
          });
          
          // Should get a response (even if it's an error)
          expect((result.content as any)).toBeDefined();
          expect((result.content as any)[0]).toHaveProperty('text');
        } catch (error) {
          // If there's an error, it should be a proper MCP error, not a crash
          expect(error).toBeDefined();
        }
      }
    }, 20000);
  });
});
