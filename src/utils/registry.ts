import { ServiceRegistry } from "../types/service.js";
import { WeatherService } from "../services/weather.js";
import { WeatherSchema } from "../types/weather.js";

const weatherService = new WeatherService();

export const serviceRegistry: ServiceRegistry = {
    weather: [
        {
            name: "getWeather",
            description: "Get the current weather for a given location",
            inputSchema: WeatherSchema,
            handler: async (input) => await weatherService.getWeather(input)
        }
    ]
    // Future services can be added here:
    // finance: [...],
    // news: [...],
    // sports: [...],
    // etc.
};

export function getAllTools() {
    const tools: Array<{
        name: string;
        description: string;
        inputSchema: any;
        handler: (input: any) => Promise<string>;
    }> = [];

    Object.values(serviceRegistry).forEach(serviceTools => {
        tools.push(...serviceTools);
    });

    return tools;
}
