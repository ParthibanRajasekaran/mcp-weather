import { z } from "zod";

export interface WeatherData {
    latitude: number;
    longitude: number;
    current: {
        time: string;
        temperature_2m: number;
        apparent_temperature: number;
        is_day: number;
        rain: number;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
    };
}

export interface GeocodingResult {
    results: Array<{
        latitude: number;
        longitude: number;
        name: string;
        country: string;
    }>;
}

export const WeatherSchema = z.object({
    city: z.string().min(1, "City name cannot be empty").describe("The city to get the weather for")
});

export type WeatherInput = z.infer<typeof WeatherSchema>;
