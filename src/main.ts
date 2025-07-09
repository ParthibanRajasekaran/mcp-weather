import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WeatherService } from "./services/weather.js";

export const server = new McpServer({
    name: "MCP Data Server",
    version: "1.0.0",
    description: "A comprehensive Model Context Protocol server providing various data services"
});

// Initialize services
const weatherService = new WeatherService();

// Register Weather Tools
server.tool(
    "getWeather",
    "Get the current weather for a given location",
    { city: z.string().describe("The city to get the weather for") },
    async ({ city }: { city: string }) => {
        const result = await weatherService.getWeather({ city });
        return {
            content: [
                {
                    type: "text",
                    text: result
                }
            ]
        };
    }
);

// TODO: Add more services here
// server.tool("getNews", "Get latest news", NewsSchema, async (input) => { ... });
// server.tool("getStocks", "Get stock prices", StockSchema, async (input) => { ... });


const transport = new StdioServerTransport();

export async function main() {
    await server.connect(transport);
}

// Simple entrypoint check that works in all environments
// Check if this module is being executed directly vs imported
const isMainModule = () => {
    // Simple heuristic: if we're in a test environment, don't auto-run
    return process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined;
};

if (isMainModule()) {
    main().catch(console.error);
}
