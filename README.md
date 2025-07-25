# MCP Data Server �

A comprehensive Model Context Protocol (MCP) server that provides various data services, starting with real-time weather data and designed for easy extension to other data sources.

<a href="https://glama.ai/mcp/servers/@ParthibanRajasekaran/mcp-weather">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@ParthibanRajasekaran/mcp-weather/badge" alt="Weather Server MCP server" />
</a>

## 🚀 Features

- **Modular Architecture**: Easy to extend with new data services
- **Real-time Weather Data**: Get current weather conditions for any city
- **MCP Protocol Compliance**: Fully compatible with the Model Context Protocol
- **TypeScript Support**: Written in TypeScript for better type safety
- **Stdio Transport**: Uses standard input/output for communication
- **Extensible Design**: Ready for news, finance, sports, and other data services

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- TypeScript support

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/ParthibanRajasekaran/mcp-weather.git
cd mcp-weather
```

2. Install dependencies:
```bash
npm install
```

3. Build the project (optional):
```bash
npm run build
```

## 🎯 Usage

### Running the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

### MCP Configuration

Add the following configuration to your MCP client's configuration file (`.vscode/mcp.json`):

```json
{
    "servers": {
        "mcp-data-server": {
            "type": "stdio",
            "command": "npx",
            "args": [
                "-y",
                "tsx",
                "src/main.ts"
            ]
        }
    }
}
```

## 🔧 Available Services

### Weather Service

#### `getWeather`
Get current weather data for a specified city.

**Parameters:**
- `city` (string): The name of the city to get weather for

**Example Usage:**
```typescript
// MCP client call
const weather = await mcpClient.callTool("getWeather", { city: "London" });
```

**Response Format:**
```json
{
  "latitude": 51.51147,
  "longitude": -0.13078308,
  "current": {
    "time": "2025-07-08T06:15",
    "temperature_2m": 13.9,
    "apparent_temperature": 11,
    "is_day": 1,
    "rain": 0
  },
  "hourly": {
    "time": [...],
    "temperature_2m": [...]
  }
}
```

### 🔮 Future Services (Planned)

- **News Service**: Get latest news from various sources
- **Finance Service**: Stock prices, market data, cryptocurrency
- **Sports Service**: Live scores, team statistics, schedules
- **Social Media Service**: Trending topics, social metrics
- **Maps Service**: Location data, directions, places

## 🏗️ Architecture

### Project Structure

```
mcp-weather/
├── src/
│   ├── main.ts              # Main server entry point
│   ├── services/            # Data service implementations
│   │   └── weather.ts       # Weather service
│   ├── types/               # TypeScript type definitions
│   │   ├── weather.ts       # Weather-related types
│   │   └── service.ts       # Base service interfaces
│   └── utils/               # Utility functions
│       └── registry.ts      # Service registry
├── .vscode/
│   └── mcp.json            # MCP client configuration
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md              # This file
```

### Transport Layer
The server uses **StdioServerTransport** for communication:
- **Input**: Standard input (stdin)
- **Output**: Standard output (stdout)
- **Protocol**: JSON-RPC over stdio
- **Benefits**: Simple, reliable, and widely supported

### Service Architecture

Each service follows this pattern:

```typescript
// 1. Define types
interface ServiceInput { /* ... */ }
interface ServiceOutput { /* ... */ }

// 2. Create service class
class MyService {
    async getData(input: ServiceInput): Promise<string> {
        // Implementation
    }
}

// 3. Register with MCP server
server.tool("myTool", "Description", schema, handler);
```

## 🤖 AI Assistant Integration

### Claude Desktop (Available Now)
Your MCP server works with Claude Desktop out of the box! See [`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md) for setup instructions.

### GitHub Copilot (Coming Soon)
GitHub Copilot doesn't support MCP yet, but your server is ready! See [`docs/GITHUB_COPILOT_INTEGRATION.md`](docs/GITHUB_COPILOT_INTEGRATION.md) for:
- Current workarounds using VS Code extensions
- What to expect when MCP support is added
- Example integration patterns

### VS Code Extension Example
Check out [`examples/vscode-extension/`](examples/vscode-extension/) for a working example that integrates your MCP server with VS Code today!

## 🔍 MCP Inspector Integration

For debugging and development, you can use the MCP Inspector:

1. Install the MCP Inspector:
```bash
npm install -g @modelcontextprotocol/inspector
```

2. Run the inspector:
```bash
npx @modelcontextprotocol/inspector npx tsx src/main.ts
```

3. Open the inspector in your browser at `http://localhost:5173`

## 🧪 Development

### Adding New Services

1. **Create Type Definitions** (`src/types/myservice.ts`):
```typescript
export interface MyServiceInput {
    query: string;
}

export const MyServiceSchema = z.object({
    query: z.string().describe("Your query parameter")
});
```

2. **Implement Service** (`src/services/myservice.ts`):
```typescript
export class MyService {
    async getData(input: MyServiceInput): Promise<string> {
        // Your implementation
        return "Service response";
    }
}
```

3. **Register Tool** (in `src/main.ts`):
```typescript
server.tool(
    "myTool",
    "Description of my tool",
    MyServiceSchema,
    async ({ query }: { query: string }) => {
        const result = await myService.getData({ query });
        return {
            content: [{ type: "text", text: result }]
        };
    }
);
```

### Development Scripts
- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Run the built project
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🌐 API Details

### Weather Service API
- **Geocoding**: `https://geocoding-api.open-meteo.com/v1/search`
- **Weather**: `https://api.open-meteo.com/v1/forecast`
- **Rate Limit**: Free tier, no authentication required
- **Model**: UKMO Seamless (UK Met Office)

## 🤝 Contributing

We welcome contributions for new data services! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-service`
3. Add your service following the architecture above
4. Add tests and documentation
5. Commit your changes: `git commit -m 'Add new service'`
6. Push to the branch: `git push origin feature/new-service`
7. Open a Pull Request

### Service Guidelines
- Each service should be self-contained in its own file
- Use TypeScript for type safety
- Include proper error handling
- Add JSDoc comments for public methods
- Follow the existing code style

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://github.com/modelcontextprotocol/specification) for the protocol specification
- [Open-Meteo](https://open-meteo.com/) for the free weather API
- [TypeScript](https://www.typescriptlang.org/) for type safety

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/ParthibanRajasekaran/mcp-weather/issues) page
2. Create a new issue with detailed information
3. Contact: rajasekaran.parthiban7@gmail.com

## 🔄 Changelog

### v1.0.0
- Initial release with weather service
- Modular architecture for easy extension
- MCP protocol compliance
- TypeScript implementation
- Stdio transport support

---

Made with ❤️ by [ParthibanRajasekaran](https://github.com/ParthibanRajasekaran) | Ready for extension to any data service!
const server = new McpServer({
    name: "MCP Weather Server",
    version: "1.0.0",
    description: "A server that provides weather data"
});
```