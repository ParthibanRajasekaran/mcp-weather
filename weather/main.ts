import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


const server = new McpServer({
    name: "MCP Weather Server",
    version: "1.0.0",
    description: "A server that provides weather data"
});

server.tool(
    "getWeather",
    "Get the current weather for a given location",
    { city: z.string().describe("The city to get the weather for") },
    async ({ city }) => {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`);
        const data = await response.json();
        
        //handle city not found
        if (!data.results || data.results.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No results found for city: ${city}. Please try another city.`
                    }
                ]
            };
        }

        // retrieve weather data using the coordinates of the first result
        const { latitude, longitude } = data.results[0];
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&models=ukmo_seamless&current=temperature_2m,apparent_temperature,is_day,rain`);
        const weatherData = await weatherResponse.json();

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(weatherData, null, 2)
                }
            ]
        };
    }
);

const transport = new StdioServerTransport();

async function main() {
    await server.connect(transport);
}

main().catch(console.error);
