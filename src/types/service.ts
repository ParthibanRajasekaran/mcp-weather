export interface DataService {
    name: string;
    description: string;
    version: string;
}

export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: any;
    handler: (input: any) => Promise<string>;
}

export interface ServiceRegistry {
    [key: string]: ToolDefinition[];
}
