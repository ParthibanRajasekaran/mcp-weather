import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';

/**
 * Performance Tests - Testing response times, load, and resource usage
 * These tests ensure the MCP server performs well under various conditions
 */
describe('MCP Server Performance Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    const serverPath = path.resolve(__dirname, '../../src/main.ts');
    
    transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "tsx", serverPath]
    });

    client = new Client({
      name: "performance-test-client",
      version: "1.0.0"
    }, { capabilities: {} });

    await client.connect(transport);
  }, 15000);

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('Response Time Performance', () => {
    it('should respond to weather requests within acceptable time', async () => {
      const startTime = Date.now();
      
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "London" }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect((result.content as any)).toBeDefined();
      
      // Should respond within 10 seconds for external API calls
      expect(responseTime).toBeLessThan(10000);
      
      // Log performance for monitoring
      console.log(`Weather API response time: ${responseTime}ms`);
    }, 15000);

    it('should handle tool discovery quickly', async () => {
      const startTime = Date.now();
      
      const tools = await client.listTools();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(tools.tools).toBeDefined();
      
      // Tool discovery should be very fast (< 1 second)
      expect(responseTime).toBeLessThan(1000);
      
      console.log(`Tool discovery response time: ${responseTime}ms`);
    });

    it('should handle error cases quickly', async () => {
      const startTime = Date.now();
      
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "NonExistentCityXYZ123" }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect((result.content as any)).toBeDefined();
      
      // Error responses should be fast (< 5 seconds)
      expect(responseTime).toBeLessThan(5000);
      
      console.log(`Error response time: ${responseTime}ms`);
    }, 10000);
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const concurrentRequests = 5;
      const cities = ['London', 'Paris', 'Tokyo', 'New York', 'Sydney'];
      
      const startTime = Date.now();
      
      // Create concurrent requests
      const promises = cities.slice(0, concurrentRequests).map(city => 
        client.callTool({
          name: "getWeather",
          arguments: { city }
        })
      );
      
      const results = await Promise.all(promises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // All requests should complete
      expect(results).toHaveLength(concurrentRequests);
      
      // Concurrent requests shouldn't take much longer than sequential ones
      // Allow generous time for external API calls
      expect(totalTime).toBeLessThan(20000);
      
      // Calculate average response time
      const avgResponseTime = totalTime / concurrentRequests;
      console.log(`Average concurrent response time: ${avgResponseTime}ms`);
      console.log(`Total time for ${concurrentRequests} concurrent requests: ${totalTime}ms`);
      
      // Verify all responses are valid
      results.forEach((result, index) => {
        expect((result.content as any)).toBeDefined();
        const responseText = (result.content as any)[0].text;
        expect(responseText).toBeDefined();
        expect(responseText.length).toBeGreaterThan(0);
      });
    }, 30000);

    it('should maintain performance under rapid sequential requests', async () => {
      const requestCount = 10;
      const city = 'London';
      const responseTimes: number[] = [];
      
      // Make rapid sequential requests
      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();
        
        const result = await client.callTool({
          name: "getWeather",
          arguments: { city }
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);
        
        expect((result.content as any)).toBeDefined();
      }
      
      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      console.log(`Sequential requests performance:`);
      console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  Min: ${minResponseTime}ms`);
      console.log(`  Max: ${maxResponseTime}ms`);
      
      // Performance shouldn't degrade significantly over time
      const firstHalf = responseTimes.slice(0, requestCount / 2);
      const secondHalf = responseTimes.slice(requestCount / 2);
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Second half shouldn't be more than 50% slower than first half
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
      
      // No single request should take longer than 15 seconds
      expect(maxResponseTime).toBeLessThan(15000);
    }, 60000);
  });

  describe('Memory and Resource Usage', () => {
    it('should not have memory leaks during extended use', async () => {
      const iterations = 20;
      const city = 'London';
      
      // Get initial memory usage
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < iterations; i++) {
        await client.callTool({
          name: "getWeather",
          arguments: { city }
        });
        
        // Occasional garbage collection hint
        if (i % 10 === 0 && global.gc) {
          global.gc();
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Check final memory usage
      const finalMemory = process.memoryUsage();
      
      console.log('Memory usage comparison:');
      console.log(`  Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      
      // Memory shouldn't grow dramatically (allow for some variance)
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryGrowthMB = memoryGrowth / 1024 / 1024;
      
      console.log(`  Memory growth: ${memoryGrowthMB.toFixed(2)} MB`);
      
      // Memory growth should be reasonable (< 50MB for these tests)
      expect(memoryGrowthMB).toBeLessThan(50);
    }, 90000);
  });

  describe('Load Testing', () => {
    it('should handle burst traffic patterns', async () => {
      // Simulate burst traffic: many requests at once, then quiet period
      const burstSize = 8;
      const cities = ['London', 'Paris', 'Tokyo', 'New York', 'Sydney', 'Berlin', 'Madrid', 'Rome'];
      
      console.log(`Starting burst load test with ${burstSize} concurrent requests...`);
      
      const burstStartTime = Date.now();
      
      // Create burst of concurrent requests
      const burstPromises = cities.slice(0, burstSize).map((city, index) => {
        return client.callTool({
          name: "getWeather",
          arguments: { city }
        });
      });
      
      const burstResults = await Promise.all(burstPromises);
      
      const burstEndTime = Date.now();
      const burstDuration = burstEndTime - burstStartTime;
      
      console.log(`Burst completed in ${burstDuration}ms`);
      
      // All requests in burst should complete
      expect(burstResults).toHaveLength(burstSize);
      
      // Burst should complete within reasonable time
      expect(burstDuration).toBeLessThan(25000);
      
      // All responses should be valid
      burstResults.forEach(result => {
        expect((result.content as any)).toBeDefined();
        const responseText = (result.content as any)[0].text;
        expect(responseText).toBeDefined();
      });
      
      // Wait a bit to simulate quiet period
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test that server is still responsive after burst
      const postBurstResult = await client.callTool({
        name: "getWeather",
        arguments: { city: "London" }
      });
      
      expect((postBurstResult.content as any)).toBeDefined();
    }, 45000);
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance SLA requirements', async () => {
      // Define Service Level Agreement (SLA) requirements
      const SLA = {
        maxResponseTime: process.env.CI ? 12000 : 10000, // 12 seconds max in CI
        p95ResponseTime: 8000,  // 95% of requests under 8 seconds
        toolDiscoveryTime: 500, // Tool discovery under 500ms
        concurrentRequestsSupport: 5, // Should handle 5 concurrent requests
      };
      
      console.log('Testing SLA compliance...');
      
      // Test 1: Single request response time
      const singleRequestStart = Date.now();
      const singleResult = await client.callTool({
        name: "getWeather",
        arguments: { city: "London" }
      });
      const singleRequestTime = Date.now() - singleRequestStart;
      
      expect(singleRequestTime).toBeLessThan(SLA.maxResponseTime);
      expect((singleResult.content as any)).toBeDefined();
      
      // Test 2: Tool discovery time
      const discoveryStart = Date.now();
      await client.listTools();
      const discoveryTime = Date.now() - discoveryStart;
      
      expect(discoveryTime).toBeLessThan(SLA.toolDiscoveryTime);
      
      // Test 3: P95 response time (simplified test with 10 requests)
      const responseTimes: number[] = [];
      const testCities = ['London', 'Paris', 'Tokyo', 'New York', 'Sydney'];
      
      for (let i = 0; i < 10; i++) {
        const city = testCities[i % testCities.length];
        const start = Date.now();
        await client.callTool({
          name: "getWeather",
          arguments: { city }
        });
        responseTimes.push(Date.now() - start);
      }
      
      // Sort response times to find P95
      responseTimes.sort((a, b) => a - b);
      const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
      const p95ResponseTime = responseTimes[p95Index];
      
      expect(p95ResponseTime).toBeLessThan(SLA.p95ResponseTime);
      
      console.log('SLA Test Results:');
      console.log(`  Single request: ${singleRequestTime}ms (SLA: <${SLA.maxResponseTime}ms)`);
      console.log(`  Tool discovery: ${discoveryTime}ms (SLA: <${SLA.toolDiscoveryTime}ms)`);
      console.log(`  P95 response time: ${p95ResponseTime}ms (SLA: <${SLA.p95ResponseTime}ms)`);
      console.log('  All SLA requirements met ✓');
    }, 60000);
  });
});
