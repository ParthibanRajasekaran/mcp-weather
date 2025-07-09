// Mock fetch for testing with robust CI support
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

// Setup global fetch mock that always works in CI
export const setupGlobalFetchMock = () => {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    // Always return successful mocked responses regardless of environment
    if (url.includes('geocoding-api.open-meteo.com')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGeocodingResponse)
      } as Response);
    }
    
    if (url.includes('api.open-meteo.com')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockWeatherResponse)
      } as Response);
    }
    
    // Fallback for any other URLs
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' })
    } as Response);
  });
};

// Helper to setup successful API mocks
export const setupSuccessfulMocks = () => {
  (global.fetch as jest.MockedFunction<typeof fetch>)
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockGeocodingResponse)
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockWeatherResponse)
    } as Response);
};

// Setup error responses for testing error handling
export const setupErrorMocks = () => {
  (global.fetch as jest.MockedFunction<typeof fetch>)
    .mockRejectedValue(new Error('Network error'));
};
