import * as vscode from 'vscode';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join } from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP Weather Extension is now active!');

    // Command to insert current weather at cursor
    const insertWeatherCommand = vscode.commands.registerCommand('weather.insertCurrent', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        // Get city from user
        const city = await vscode.window.showInputBox({
            prompt: 'Enter city name',
            placeHolder: 'London'
        });

        if (!city) {
            return;
        }

        try {
            // Connect to MCP server
            const mcpServerPath = join(context.extensionPath, '..', '..', 'src', 'main.ts');
            const transport = new StdioClientTransport({
                command: "npx",
                args: ["-y", "tsx", mcpServerPath]
            });

            const client = new Client({
                name: "vscode-weather-extension",
                version: "1.0.0"
            }, { capabilities: {} });

            await client.connect(transport);

            // Get weather data
            const result = await client.callTool({
                name: "getWeather",
                arguments: { city }
            });
            
            // Parse the weather data
            const weatherData = JSON.parse((result.content as any)[0].text);
            
            // Format for insertion
            const weatherComment = `// Weather in ${city}: ${weatherData.temperature}°C, ${weatherData.conditions} (${new Date().toLocaleString()})`;
            
            // Insert at cursor position
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.start, weatherComment);
            });

            await client.close();
            
        } catch (error) {
            vscode.window.showErrorMessage(`Weather fetch failed: ${error.message}`);
        }
    });

    // Command to show weather in info panel
    const showWeatherCommand = vscode.commands.registerCommand('weather.showWeather', async () => {
        const city = await vscode.window.showInputBox({
            prompt: 'Enter city name',
            placeHolder: 'London'
        });

        if (!city) {
            return;
        }

        try {
            // Connect to MCP server
            const mcpServerPath = join(context.extensionPath, '..', '..', 'src', 'main.ts');
            const transport = new StdioClientTransport({
                command: "npx",
                args: ["-y", "tsx", mcpServerPath]
            });

            const client = new Client({
                name: "vscode-weather-extension",
                version: "1.0.0"
            }, { capabilities: {} });

            await client.connect(transport);

            // Get weather data
            const result = await client.callTool({
                name: "getWeather",
                arguments: { city }
            });
            
            // Parse and display
            const weatherData = JSON.parse((result.content as any)[0].text);
            
            vscode.window.showInformationMessage(
                `Weather in ${city}: ${weatherData.temperature}°C, ${weatherData.conditions}`
            );

            await client.close();
            
        } catch (error) {
            vscode.window.showErrorMessage(`Weather fetch failed: ${error.message}`);
        }
    });

    context.subscriptions.push(insertWeatherCommand, showWeatherCommand);
}

export function deactivate() {}
