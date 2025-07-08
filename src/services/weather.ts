import { WeatherData, GeocodingResult, WeatherInput } from "../types/weather.js";

export class WeatherService {
    private static readonly GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
    private static readonly WEATHER_API = "https://api.open-meteo.com/v1/forecast";

    async getWeather(input: WeatherInput): Promise<string> {
        try {
            // Geocoding
            const geocodeResponse = await fetch(
                `${WeatherService.GEOCODING_API}?name=${input.city}&count=10&language=en&format=json`
            );
            const geocodeData: GeocodingResult = await geocodeResponse.json();

            // Handle city not found
            if (!geocodeData.results || geocodeData.results.length === 0) {
                return `No results found for city: ${input.city}. Please try another city.`;
            }

            // Get weather data
            const { latitude, longitude } = geocodeData.results[0];
            const weatherResponse = await fetch(
                `${WeatherService.WEATHER_API}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&models=ukmo_seamless&current=temperature_2m,apparent_temperature,is_day,rain`
            );
            const weatherData: WeatherData = await weatherResponse.json();

            return JSON.stringify(weatherData, null, 2);
        } catch (error) {
            return `Error retrieving weather data: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
}
