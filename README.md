
# JSON Linter, Formatter, and Fixer Tool

A lightweight, browser-based tool to lint, format, fix, minify, and prettify JSON data. This tool is designed for developers and data enthusiasts to validate and organize JSON quickly, all from the convenience of a web interface.

## Features

- **JSON Linting**: Validate JSON syntax and highlight errors, showing the exact line and character of the issue.
- **Fix JSON**: Automatically corrects common JSON syntax errors using [JSONRepair](https://github.com/njoylab/jsonrepair), making it more forgiving for common mistakes.
- **Syntax Highlighting**: Colorful code highlighting for better readability and error detection.
- **Local Storage**: Save and retrieve your JSON data automatically between sessions.
- **Minify JSON**: Compress JSON by removing whitespace, making it easier to transmit or store.
- **Copy to Clipboard**: Quickly copy formatted JSON to use in other applications or share with others.

## Keyboard Shortcuts

- `Ctrl+Alt+L`: Lint JSON
- `Ctrl+Alt+M`: Minify JSON
- `Ctrl+Alt+Backspace`: Clear JSON
- `Ctrl+Alt+C`: Copy JSON to Clipboard
- `Ctrl+Alt+S`: Save JSON to Local Storage
- `Ctrl+Alt+D`: Download JSON
- `Ctrl+Alt+O`: Toggle Right Navigation Panel for Loading/Saving JSON files
- `Ctrl+Alt+H`: Toggle Help Screen

## Demo

You can use this tool online at [jsonlint.echovalue.dev](https://jsonlint.echovalue.dev).

## Getting Started

### Prerequisites

To run this project locally, you only need a web browser.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/njoylab/json-linter-tool
   ```
   
2. Navigate into the project directory:
   ```bash
   cd json-linter-tool
   ```

3. Open `index.html` in your browser to use the tool locally.

### Usage

1. Paste or type your JSON data into the provided text area.
2. Use the buttons to:
   - **Lint**: Check and Format JSON validity.
   - **Fix**: Correct common syntax errors.
   - **Minify**: Remove whitespace for a compact JSON.
   - **Copy to Clipboard**: Copy JSON data for easy sharing.

Your JSON data is automatically saved to local storage and will be restored when you return to the tool.

### Running Tests

1. Install test dependencies:
   ```bash
   npm install
   ```

2. Run the test suite:
   ```bash
   npm test
   ```

3. For development with watch mode:
   ```bash
   npm run test:watch
   ```

The test suite includes:
- Unit tests for JSON parsing and formatting
- Integration tests for the UI components
- Local storage functionality tests

## Contributing

Contributions are welcome! If you'd like to improve this tool or fix a bug, please fork the repository and submit a pull request.

## Feedback and Issues

For feedback or to report issues, please open an issue in the [GitHub repository](https://github.com/yourusername/json-linter-tool/issues).

## License

This project is open source and available under the [MIT License](LICENSE).
