import { WeatherService } from '../../src/services/weather.js';

// Mock fetch globally for these tests
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('WeatherService', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
    jest.clearAllMocks();
  });

  describe('getWeather', () => {
    it('should return weather data for a valid city', async () => {
      // Mock geocoding response
      const mockGeocodingResponse = {
        results: [{
          name: 'London',
          latitude: 51.5074,
          longitude: -0.1278,
          country: 'United Kingdom',
          timezone: 'Europe/London'
        }]
      };

      // Mock weather response
      const mockWeatherResponse = {
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'Europe/London',
        current: {
          time: '2024-01-15T14:30',
          temperature_2m: 15.5,
          apparent_temperature: 14.2,
          is_day: 1,
          rain: 0
        },
        hourly: {
          time: ['2024-01-15T14:00', '2024-01-15T15:00'],
          temperature_2m: [15.5, 16.0]
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWeatherResponse)
        } as Response);

      const result = await weatherService.getWeather({ city: 'London' });
      const weatherData = JSON.parse(result);

      expect(weatherData).toEqual(mockWeatherResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Check geocoding API call
      expect(mockFetch).toHaveBeenNthCalledWith(1, 
        'https://geocoding-api.open-meteo.com/v1/search?name=London&count=1&language=en&format=json'
      );
      
      // Check weather API call
      expect(mockFetch).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('https://api.open-meteo.com/v1/forecast')
      );
    });

    it('should handle city not found error', async () => {
      const mockGeocodingResponse = {
        results: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse)
      } as Response);

      const result = await weatherService.getWeather({ city: 'NonExistentCity' });

      expect(result).toContain('Error: City "NonExistentCity" not found');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle geocoding API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' })
      } as Response);

      const result = await weatherService.getWeather({ city: 'London' });

      expect(result).toContain('Error fetching location data');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle weather API errors', async () => {
      const mockGeocodingResponse = {
        results: [{
          name: 'London',
          latitude: 51.5074,
          longitude: -0.1278,
          country: 'United Kingdom',
          timezone: 'Europe/London'
        }]
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGeocodingResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Weather service unavailable' })
        } as Response);

      const result = await weatherService.getWeather({ city: 'London' });

      expect(result).toContain('Error fetching weather data');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await weatherService.getWeather({ city: 'London' });

      expect(result).toContain('Error retrieving weather');
      expect(result).toContain('Network error');
    });

    it('should handle empty city input', async () => {
      const result = await weatherService.getWeather({ city: '' });

      expect(result).toContain('Error: City name cannot be empty');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
