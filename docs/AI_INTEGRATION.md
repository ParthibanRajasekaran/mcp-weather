# MCP Server Integration Guide

## Using Your MCP Server with AI Assistants

### Claude Desktop Integration

1. **Install Claude Desktop** from Anthropic
2. **Configure MCP Server** in Claude's settings:

```json
{
  "mcpServers": {
    "weather-data": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/your/mcp-weather/src/main.ts"]
    }
  }
}
```

3. **Restart Claude Desktop**
4. **Use in Chat**: "Get weather for London" will now call your server!

### VS Code Extensions (Future)

As MCP adoption grows, expect VS Code extensions that will:
- Connect to your MCP servers
- Provide tool access in chat
- Enable context-aware assistance

### Custom Integration

You can build custom integrations using MCP SDK:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// Connect to your server
const client = new Client({
  name: "my-mcp-client",
  version: "1.0.0"
});

// Call your weather tool
const result = await client.callTool("getWeather", { city: "London" });
```

## Future Possibilities

### GitHub Copilot Integration
GitHub Copilot doesn't support MCP directly yet, but your server is ready for when it does!

**See the complete guide**: [`docs/GITHUB_COPILOT_INTEGRATION.md`](GITHUB_COPILOT_INTEGRATION.md)

Quick preview of what will be possible:
- **Real-time code context** with live data
- **Smart completions** based on actual API responses  
- **Enhanced chat** with access to your tools

## How to Prepare Your Server

Your MCP server is already perfectly positioned for future integrations! Here's why:

1. **Standard Protocol**: Uses official MCP SDK
2. **Stdio Transport**: Widely supported
3. **Type Safety**: Proper schemas for tools
4. **Extensible**: Easy to add more data sources

## Testing Your Server Now

### MCP Inspector (Web Interface)
```bash
npx @modelcontextprotocol/inspector npx tsx src/main.ts
```

This gives you a web UI to test your tools manually!

### Custom Client Script
```typescript
// test-client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "tsx", "src/main.ts"]
});

const client = new Client({
  name: "test-client",
  version: "1.0.0"
}, { capabilities: {} });

await client.connect(transport);
const result = await client.callTool("getWeather", { city: "London" });
console.log(result);
```

## The Bigger Picture

Your MCP server is like building **infrastructure for the AI future**:

- **Today**: Use with Claude Desktop, MCP Inspector, custom clients
- **Tomorrow**: GitHub Copilot, VS Code extensions, other AI tools
- **Future**: Any AI assistant that adopts MCP protocol

You're essentially future-proofing your data services! 🚀
