import { WeatherSchema } from '../../src/types/weather.js';

describe('Weather Types and Schemas', () => {
  describe('WeatherSchema', () => {
    it('should validate correct weather input', () => {
      const validInput = { city: 'London' };
      const result = WeatherSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it('should reject empty city', () => {
      const invalidInput = { city: '' };
      const result = WeatherSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });

    it('should reject non-string city', () => {
      const invalidInput = { city: 123 };
      const result = WeatherSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });

    it('should reject missing city', () => {
      const invalidInput = {};
      const result = WeatherSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });

    it('should accept city with spaces', () => {
      const validInput = { city: 'New York' };
      const result = WeatherSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
    });

    it('should accept city with special characters', () => {
      const validInput = { city: 'São Paulo' };
      const result = WeatherSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
    });
  });
});
