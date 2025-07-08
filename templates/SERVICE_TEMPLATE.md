# Service Template

Use this template to create new data services for the MCP Data Server.

## Files to Create

### 1. Type Definitions (`src/types/myservice.ts`)

```typescript
import { z } from "zod";

// Define your service input interface
export interface MyServiceInput {
    query: string;
    // Add more properties as needed
}

// Define your service output interface (optional)
export interface MyServiceOutput {
    data: any;
    // Add more properties as needed
}

// Define Zod schema for input validation
export const MyServiceSchema = z.object({
    query: z.string().describe("Description of the query parameter"),
    // Add more schema validations as needed
});

export type MyServiceInputType = z.infer<typeof MyServiceSchema>;
```

### 2. Service Implementation (`src/services/myservice.ts`)

```typescript
import { MyServiceInput } from "../types/myservice.js";

export class MyService {
    private static readonly API_BASE_URL = "https://api.example.com";

    async getData(input: MyServiceInput): Promise<string> {
        try {
            // Your API call logic here
            const response = await fetch(`${MyService.API_BASE_URL}/endpoint?query=${input.query}`);
            const data = await response.json();

            // Handle errors
            if (!response.ok) {
                return `Error: ${data.message || 'Unknown error occurred'}`;
            }

            // Return formatted data
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error retrieving data: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
}
```

### 3. Register Tool (in `src/main.ts`)

```typescript
// Import your service
import { MyService } from "./services/myservice.js";
import { MyServiceSchema } from "./types/myservice.js";

// Initialize service
const myService = new MyService();

// Register tool
server.tool(
    "myTool",
    "Description of what your tool does",
    MyServiceSchema,
    async ({ query }: { query: string }) => {
        const result = await myService.getData({ query });
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
```

## Example Service Ideas

### News Service
```typescript
export interface NewsInput {
    category?: string;
    country?: string;
    limit?: number;
}

export const NewsSchema = z.object({
    category: z.string().optional().describe("News category (e.g., business, technology)"),
    country: z.string().optional().describe("Country code (e.g., us, uk)"),
    limit: z.number().optional().describe("Number of articles to return")
});
```

### Finance Service
```typescript
export interface StockInput {
    symbol: string;
    period?: string;
}

export const StockSchema = z.object({
    symbol: z.string().describe("Stock symbol (e.g., AAPL, GOOGL)"),
    period: z.string().optional().describe("Time period (e.g., 1d, 1w, 1m)")
});
```

### Sports Service
```typescript
export interface SportsInput {
    sport: string;
    league?: string;
    team?: string;
}

export const SportsSchema = z.object({
    sport: z.string().describe("Sport type (e.g., football, basketball)"),
    league: z.string().optional().describe("League name (e.g., NFL, NBA)"),
    team: z.string().optional().describe("Team name")
});
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Type Safety**: Use TypeScript interfaces and Zod schemas
3. **Documentation**: Add JSDoc comments to your service methods
4. **Rate Limiting**: Respect API rate limits and add appropriate delays
5. **Caching**: Consider implementing caching for frequently requested data
6. **Environment Variables**: Use environment variables for API keys
7. **Testing**: Write unit tests for your service methods

## Adding Environment Variables

If your service needs API keys, add them to a `.env` file:

```bash
# .env
MY_SERVICE_API_KEY=your_api_key_here
```

And access them in your service:

```typescript
const apiKey = process.env.MY_SERVICE_API_KEY;
if (!apiKey) {
    throw new Error('MY_SERVICE_API_KEY environment variable is required');
}
```

Don't forget to add the `.env` file to your `.gitignore`!
