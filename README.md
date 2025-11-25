
# JSON Linter, Formatter, and Fixer Tool

A lightweight, browser-based tool to lint, format, fix, minify, filter, and prettify JSON data. This tool is designed for developers and data enthusiasts to validate, transform, and organize JSON quickly, all from the convenience of a web interface.

## Features

### Core Functionality
- **JSON Linting**: Validate JSON syntax and highlight errors, showing the exact line and character of the issue.
- **Fix JSON**: Automatically corrects common JSON syntax errors using [JSONRepair](https://github.com/njoylab/jsonrepair), making it more forgiving for common mistakes.
- **Syntax Highlighting**: Colorful code highlighting for better readability and error detection.
- **Local Storage**: Save and retrieve your JSON data automatically between sessions.
- **Minify JSON**: Compress JSON by removing whitespace, making it easier to transmit or store.
- **Copy to Clipboard**: Quickly copy formatted JSON to use in other applications or share with others.

### Advanced Features
- **jq Filter Support**: Transform and query JSON data using jq-like syntax
  - Property access: `.key`, `.key.nested`
  - Array operations: `.[]`, `.[0]`, `.[1:3]`
  - Filtering: `select(.age > 18)`
  - Transformations: `map(.name)`, `sort`, `unique`
  - Pipeline operations: `.[] | select(.active) | .name`
  - Built-in functions: `keys`, `values`, `length`, `type`, `min`, `max`, etc.
- **Undo/Redo**: Revert changes with Ctrl+Z (up to 50 history states)
- **Code Folding**: Collapse/expand JSON objects and arrays for better navigation

## Keyboard Shortcuts

- `Ctrl+Alt+L`: Lint JSON
- `Ctrl+Alt+M`: Minify JSON
- `Ctrl+Alt+Q`: Open jq Filter Dialog
- `Ctrl+Z` (or `Cmd+Z` on Mac): Undo last change
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
2. Use the toolbar buttons to:
   - **Lint**: Check and format JSON validity.
   - **Minify**: Remove whitespace for a compact JSON.
   - **jq Filter**: Transform and query JSON using jq-like syntax.
   - **Undo**: Revert to previous state (Ctrl+Z).
   - **Clear**: Clear the editor.
   - **Save/Load**: Manage JSON files in browser storage.
   - **Copy to Clipboard**: Copy JSON data for easy sharing.

#### Using jq Filters

Click the "jq Filter" button or press `Ctrl+Alt+Q` to open the filter dialog. Examples:

```jq
# Get all names from an array of objects
.[] | .name

# Filter items by condition
.[] | select(.age > 18)

# Get unique values and sort
.tags | unique | sort

# Extract nested properties
.users[].profile.email

# Complex pipeline
.[] | select(.active == true) | {name: .name, age: .age}
```

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
- jq-lite filter operations (46 tests)
- Integration tests for the UI components
- Local storage functionality tests
- Undo/redo history management

All 93 tests should pass successfully.

## Technical Details

### jq-Lite Implementation

This tool uses a custom lightweight implementation of jq (`jq-lite.js`) designed specifically for browser environments:

- **Size**: ~10KB unminified (vs ~800KB for jq-web with WebAssembly)
- **Performance**: Pure JavaScript implementation with no WebAssembly overhead
- **Privacy**: 100% client-side processing, no data sent to servers
- **Compatibility**: Works in all modern browsers without additional dependencies

**Supported jq Operations**:
- Identity and property access: `.`, `.key`, `.key.nested`
- Array operations: `.[]`, `.[n]`, `.[n:m]`
- Built-in functions: `keys`, `values`, `length`, `type`
- Sorting and filtering: `sort`, `sort_by(.prop)`, `reverse`, `unique`
- Array utilities: `first`, `last`, `min`, `max`
- Conditionals: `select(.prop > value)` with operators `==`, `!=`, `>`, `<`, `>=`, `<=`
- Transformations: `map(.prop)`
- Pipeline operations: `|` for chaining operations

### Architecture

- **No Build Process**: Open `index.html` directly in any browser
- **Vanilla JavaScript**: No frameworks, pure DOM manipulation
- **Prism.js**: Syntax highlighting loaded via CDN
- **JSONRepair**: Error correction library for fixing malformed JSON
- **Local Storage**: Browser-based persistence with `lnt_` prefix
- **JSDOM + Jest**: Testing framework for automated tests

## Contributing

Contributions are welcome! If you'd like to improve this tool or fix a bug, please fork the repository and submit a pull request.

## Feedback and Issues

For feedback or to report issues, please open an issue in the [GitHub repository](https://github.com/yourusername/json-linter-tool/issues).

## License

This project is open source and available under the [MIT License](LICENSE).
