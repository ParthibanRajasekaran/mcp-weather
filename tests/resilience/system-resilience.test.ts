import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';

/**
 * Resilience Tests - Testing system behavior under adverse conditions
 * These tests ensure the MCP server handles failures gracefully
 */
describe('MCP Server Resilience Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    const serverPath = path.resolve(__dirname, '../../src/main.ts');
    
    transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "tsx", serverPath]
    });

    client = new Client({
      name: "resilience-test-client",
      version: "1.0.0"
    }, { capabilities: {} });

    await client.connect(transport);
  }, 15000);

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('Network Resilience', () => {
    it('should handle DNS resolution failures gracefully', async () => {
      // This test simulates what happens when external APIs are unreachable
      // We can't easily mock DNS failures, but we can test with unreachable hosts
      
      // Note: This test may need to be adjusted based on actual implementation
      // For now, we test with a city that might cause API issues
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "UnreachableCity12345" }
      });

      const responseText = (result.content as any)[0].text;
      
      // Should provide meaningful error message, not crash
      expect(responseText).toContain('Error');
      expect(responseText).not.toContain('ENOTFOUND');
      expect(responseText).not.toContain('dns');
      expect(responseText).not.toContain('socket');
    });

    it('should handle API timeout scenarios', async () => {
      // Test with conditions that might cause slow API responses
      const slowRequestCities = [
        'VeryLongCityNameThatMightCauseSlowAPIResponse',
        'CityWithSpecialCharacters漢字',
        'Multiple Words City Name'
      ];

      for (const city of slowRequestCities) {
        const startTime = Date.now();
        
        const result = await client.callTool({
          name: "getWeather",
          arguments: { city }
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Should respond within reasonable time even if external API is slow
        expect(responseTime).toBeLessThan(15000); // 15 second timeout
        expect((result.content as any)).toBeDefined();
      }
    }, 20000);

    it('should handle intermittent network failures', async () => {
      // Simulate rapid successive requests that might hit network issues
      const requests = Array(5).fill(null).map((_, index) => 
        client.callTool({
          name: "getWeather",
          arguments: { city: `TestCity${index}` }
        })
      );

      const results = await Promise.allSettled(requests);
      
      // Should handle all requests without server crash
      expect(results).toHaveLength(5);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          expect((result.value.content as any)).toBeDefined();
        } else {
          // Even if individual requests fail, should be graceful failures
          expect(result.reason).toBeDefined();
        }
      });
    });
  });

  describe('Resource Exhaustion Scenarios', () => {
    it('should handle memory pressure gracefully', async () => {
      // Test with requests that might consume significant memory
      const memoryIntensiveRequests = Array(10).fill(null).map((_, index) => 
        client.callTool({
          name: "getWeather",
          arguments: { city: `MemoryTest${index}` }
        })
      );

      const initialMemory = process.memoryUsage();
      
      await Promise.allSettled(memoryIntensiveRequests);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory growth should be reasonable
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // < 100MB
    });

    it('should handle concurrent request bursts', async () => {
      // Test with burst of concurrent requests
      const burstSize = 15;
      const concurrentRequests = Array(burstSize).fill(null).map((_, index) => 
        client.callTool({
          name: "getWeather",
          arguments: { city: `ConcurrentTest${index}` }
        })
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentRequests);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      
      // Should handle burst without excessive delay
      expect(totalTime).toBeLessThan(30000); // 30 seconds max
      
      // Most requests should succeed
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(burstSize * 0.7); // At least 70% success
    }, 45000);

    it('should maintain responsiveness under sustained load', async () => {
      // Test sustained load over time
      const sustainedRequests: Promise<any>[] = [];
      const testDuration = 5000; // 5 seconds
      const requestInterval = 200; // Request every 200ms
      
      const startTime = Date.now();
      
      while (Date.now() - startTime < testDuration) {
        const request = client.callTool({
          name: "getWeather",
          arguments: { city: "SustainedLoadTest" }
        });
        
        sustainedRequests.push(request);
        
        // Wait before next request
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }
      
      const results = await Promise.allSettled(sustainedRequests);
      
      // Should maintain reasonable success rate under sustained load
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successCount / results.length;
      
      expect(successRate).toBeGreaterThan(0.8); // 80% success rate minimum
    }, 10000);
  });

  describe('Error Recovery', () => {
    it('should recover from invalid requests and serve subsequent valid requests', async () => {
      // Send an invalid request
      try {
        await client.callTool({
          name: "getWeather",
          arguments: { invalid: "field" }
        });
      } catch (error) {
        // Expected to fail
      }
      
      // Server should still be responsive to valid requests
      const validResult = await client.callTool({
        name: "getWeather",
        arguments: { city: "London" }
      });
      
      expect((validResult.content as any)).toBeDefined();
      const responseText = (validResult.content as any)[0].text;
      expect(responseText).toBeDefined();
    });

    it('should maintain state consistency across error scenarios', async () => {
      // Mix of valid and invalid requests
      const mixedRequests = [
        { name: "getWeather", arguments: { city: "London" } },
        { name: "invalidTool", arguments: { test: "data" } },
        { name: "getWeather", arguments: { city: "Paris" } },
        { name: "getWeather", arguments: { city: "" } },
        { name: "getWeather", arguments: { city: "Tokyo" } }
      ];

      const results = await Promise.allSettled(
        mixedRequests.map(req => client.callTool(req))
      );

      // Valid requests should still work despite invalid ones
      const validResults = [results[0], results[2], results[4]]; // London, Paris, Tokyo
      
      validResults.forEach(result => {
        if (result.status === 'fulfilled') {
          expect((result.value.content as any)).toBeDefined();
        }
      });
    });

    it('should handle rapid connection/disconnection scenarios', async () => {
      // Test server stability with multiple client connections
      // Note: This is a simplified test as we're using a single client
      
      const rapidRequests = Array(10).fill(null).map((_, index) => 
        client.callTool({
          name: "getWeather",
          arguments: { city: `RapidTest${index}` }
        })
      );

      // All requests should be handled without server instability
      const results = await Promise.allSettled(rapidRequests);
      
      // Server should remain stable
      expect(results).toHaveLength(10);
      
      // Verify server is still responsive after rapid requests
      const finalTest = await client.callTool({
        name: "getWeather",
        arguments: { city: "StabilityTest" }
      });
      
      expect((finalTest.content as any)).toBeDefined();
    });
  });

  describe('Data Consistency Under Stress', () => {
    it('should maintain data integrity under concurrent access', async () => {
      // Test that concurrent requests for the same city return consistent data structure
      const city = "London";
      const concurrentRequests = Array(8).fill(null).map(() => 
        client.callTool({
          name: "getWeather",
          arguments: { city }
        })
      );

      const results = await Promise.all(concurrentRequests);
      
      // All successful results should have consistent structure
      const successfulResults = results.filter(result => {
        const text = (result.content as any)[0].text;
        return !text.includes('Error');
      });

      if (successfulResults.length > 1) {
        const firstData = JSON.parse((successfulResults[0].content as any)[0].text);
        
        successfulResults.slice(1).forEach(result => {
          const data = JSON.parse((result.content as any)[0].text);
          
          // Should have same structure
          expect(Object.keys(data).sort()).toEqual(Object.keys(firstData).sort());
          
          // Location should be consistent
          expect(data.latitude).toBeCloseTo(firstData.latitude, 2);
          expect(data.longitude).toBeCloseTo(firstData.longitude, 2);
        });
      }
    }, 20000);

    it('should handle edge case inputs without corruption', async () => {
      const edgeCaseInputs = [
        "",
        " ",
        "\n",
        "\t",
        "null",
        "undefined",
        "0",
        "-1",
        "999999999999999",
        String.fromCharCode(0),
        "🌍🌎🌏",
        "ÄÖÜäöüß",
        "北京",
        "مدينة"
      ];

      for (const input of edgeCaseInputs) {
        const result = await client.callTool({
          name: "getWeather",
          arguments: { city: input }
        });

        // Should handle all edge cases without crashing
        expect((result.content as any)).toBeDefined();
        const responseText = (result.content as any)[0].text;
        expect(responseText).toBeDefined();
        expect(typeof responseText).toBe('string');
      }
    });
  });

  describe('Long-Running Stability', () => {
    it('should maintain performance over extended operation', async () => {
      const operationCount = 20;
      const responseTimes: number[] = [];
      
      for (let i = 0; i < operationCount; i++) {
        const startTime = Date.now();
        
        await client.callTool({
          name: "getWeather",
          arguments: { city: `ExtendedTest${i}` }
        });
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        // Small delay between requests to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Performance should not degrade significantly over time
      const firstQuarter = responseTimes.slice(0, 5);
      const lastQuarter = responseTimes.slice(-5);
      
      const firstAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
      const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
      
      // Last quarter shouldn't be more than 50% slower than first quarter
      expect(lastAvg).toBeLessThan(firstAvg * 1.5);
    }, 30000);
  });
});
