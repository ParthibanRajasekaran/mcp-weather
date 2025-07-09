import { WeatherData, GeocodingResult, WeatherInput } from "../types/weather.js";

export class WeatherService {
    private static readonly GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
    private static readonly WEATHER_API = "https://api.open-meteo.com/v1/forecast";

    async getWeather(input: WeatherInput): Promise<string> {
        try {
            // Validate input
            if (!input.city || input.city.trim() === '') {
                return 'Error: City name cannot be empty';
            }

            // Geocoding
            const geocodeResponse = await fetch(
                `${WeatherService.GEOCODING_API}?name=${input.city}&count=1&language=en&format=json`
            );
            
            if (!geocodeResponse.ok) {
                return `Error fetching location data: ${geocodeResponse.status} ${geocodeResponse.statusText}`;
            }
            
            const geocodeData: GeocodingResult = await geocodeResponse.json();

            // Handle city not found
            if (!geocodeData.results || geocodeData.results.length === 0) {
                return `Error: City "${input.city}" not found. Please check the spelling and try again.`;
            }

            // Get weather data
            const { latitude, longitude } = geocodeData.results[0];
            const weatherResponse = await fetch(
                `${WeatherService.WEATHER_API}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&models=ukmo_seamless&current=temperature_2m,apparent_temperature,is_day,rain`
            );
            
            if (!weatherResponse.ok) {
                return `Error fetching weather data: ${weatherResponse.status} ${weatherResponse.statusText}`;
            }
            
            const weatherData: WeatherData = await weatherResponse.json();

            return JSON.stringify(weatherData, null, 2);
        } catch (error) {
            return `Error retrieving weather: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
}
