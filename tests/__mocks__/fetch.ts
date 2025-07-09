// Mock fetch for testing
export const mockFetch = jest.fn();

// Default successful responses
export const mockGeocodingResponse = {
  results: [{
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    country: 'United Kingdom'
  }]
};

export const mockWeatherResponse = {
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

// Helper to setup successful API mocks
export const setupSuccessfulMocks = () => {
  (global.fetch as jest.MockedFunction<typeof fetch>)
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGeocodingResponse)
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWeatherResponse)
    } as Response);
};
