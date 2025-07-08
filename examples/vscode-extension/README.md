# VS Code Extension Example

This is a simple VS Code extension that demonstrates how to integrate your MCP weather server with VS Code today (before GitHub Copilot adds native MCP support).

## Features

- **Insert Weather Comment**: `Ctrl+Shift+W` (or `Cmd+Shift+W` on Mac) to insert current weather as a comment at cursor position
- **Show Weather**: Command palette → "Show Weather" to display weather in info panel

## Setup

1. **Install dependencies**:
   ```bash
   cd examples/vscode-extension
   npm install
   ```

2. **Compile TypeScript**:
   ```bash
   npm run compile
   ```

3. **Test in VS Code**:
   - Open VS Code
   - Go to Run → Start Debugging (F5)
   - Select "VS Code Extension Development"
   - In the new window, try the commands

## Commands

- `weather.insertCurrent` - Insert current weather at cursor
- `weather.showWeather` - Show weather in info panel

## How It Works

1. **User Input**: Extension prompts for city name
2. **MCP Connection**: Connects to your MCP server via stdio
3. **Weather Data**: Calls `getWeather` tool with city parameter
4. **Integration**: Inserts weather data into editor or shows in panel

## Example Usage

### Insert Weather Comment
1. Position cursor in your code
2. Press `Ctrl+Shift+W` (or `Cmd+Shift+W`)
3. Enter city name (e.g., "London")
4. Weather comment is inserted: `// Weather in London: 15°C, sunny (1/15/2024, 2:30:00 PM)`

### Show Weather Panel
1. Open command palette (`Ctrl+Shift+P`)
2. Type "Show Weather"
3. Enter city name
4. Weather info appears in VS Code info panel

## Future Integration

This extension demonstrates the pattern that GitHub Copilot will likely use when MCP support is added:

1. **Tool Discovery**: Connect to MCP server and list available tools
2. **Context-Aware Calls**: Call tools based on user requests or code context
3. **Response Integration**: Insert or use tool responses in coding workflow

Your MCP server is perfectly positioned for this future integration! 🚀
