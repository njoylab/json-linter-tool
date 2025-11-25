# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lightweight, browser-based JSON Linter, Formatter, and Fixer tool. It's a client-side web application with no backend dependencies that runs entirely in the browser.

**Live Demo**: https://jsonlint.echovalue.dev

## Technology Stack

- **Vanilla JavaScript** - No frameworks, pure DOM manipulation
- **Prism.js** - Syntax highlighting (loaded via CDN)
- **JSONRepair** - JSON error correction library (included as `jsonrepair.min.js`)
- **Jest + JSDOM** - Testing framework

## Development Commands

### Testing
```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
```

### Local Development
Simply open `index.html` in a browser - no build process required.

## Code Architecture

### Core Files
- `index.html` - Main HTML structure with contenteditable editor
- `script.js` - All application logic (~835 lines)
- `styles.css` - Styling and responsive design
- `jsonrepair.min.js` - Third-party JSON repair library

### Key Architectural Patterns

#### 1. ContentEditable Editor
The editor uses a `contenteditable` div instead of a textarea, which allows for rich HTML syntax highlighting. This creates complexity around cursor position management:

- **Cursor Management**: Uses the `CaretUtil` object (lines 366-466 in [script.js](script.js)) to save/restore cursor positions after content updates
- **Line Wrapping**: Content is wrapped in `.code-line` divs for line-by-line manipulation
- **Input Handling**: `handleEditorInput()` updates syntax highlighting while preserving cursor position

#### 2. Syntax Highlighting Flow
1. User types → `handleEditorInput()` captures input
2. Text content extracted via `getEditorContent()` (removes non-breaking spaces)
3. `highlightJSON()` uses Prism.js to tokenize JSON
4. Each line wrapped in `.code-line` div
5. HTML injected back into editor with cursor restored

#### 3. JSON Processing Pipeline
- **Lint** (`lintCode()`): Parse → Format with 2-space indent → Highlight → Update
- **Fix** (`fixCode()`): Use JSONRepair library to attempt automatic correction
- **Minify** (`minifyCode()`): Parse → Stringify without whitespace → Highlight

#### 4. Local Storage System
Files stored in localStorage with `lnt_` prefix:
- `getKeyName(fileName)` → `"lnt_" + fileName`
- Each entry contains: `{content: string, date: string}`
- `updateFileList()` populates right navigation panel with saved files

#### 5. Code Folding
- `toggleCollapse()` (lines 701-768) manages expanding/collapsing JSON objects and arrays
- Uses `findMatchingBraceInEditor()` to pair opening/closing braces
- Hidden lines tracked via `display: none` on `.code-line` elements
- Collapsed state indicated by `...}` or `...]` ellipsis

### Important Functions

**Cursor Management**:
- `saveCursorPosition()` / `restoreCursorPosition()` - Save/restore caret
- `CaretUtil.getCaretPosition()` / `CaretUtil.setCaretPosition()` - Low-level DOM range manipulation

**Content Processing**:
- `getEditorContent()` - Extracts plain text, replacing non-breaking spaces
- `sanitizePastedText()` - Normalizes whitespace on paste
- `handlePaste()` - Formats pasted JSON before insertion

**UI Feedback**:
- `showToast(message, type)` - Shows temporary notifications
- `handleJSONError(error)` - Parses error position and displays helpful messages

## Testing Architecture

Tests use JSDOM to simulate a browser environment:
- Mock implementations for Prism.js, JSONRepair, localStorage, and clipboard API
- Tests cover: JSON parsing, highlighting, keyboard shortcuts, file operations, and UI interactions
- All tests in `__tests__/script.test.js`

### Running a Single Test
```bash
npx jest -t "test name pattern"
```

## Common Gotchas

1. **Cursor Position**: Always use `saveCursorPosition()` / `restoreCursorPosition()` when modifying editor innerHTML
2. **Non-Breaking Spaces**: The editor inserts `\u00A0` instead of regular spaces - `getEditorContent()` handles this
3. **Line Numbers**: Updated via `updateLineNumbers()` which must be called after any editor content change
4. **Event Listeners**: Editor has listeners for `input` and `paste` events that modify content - be careful with event propagation
5. **Mobile Detection**: `isMobile()` checks window width (≤768px) for responsive behavior

## External Dependencies

All loaded via CDN (no npm build required):
- Prism.js 1.29.0 (syntax highlighting)
- Prism JSON component
- JSONRepair (included locally as minified file)

## Browser Storage

The app uses localStorage exclusively:
- All keys prefixed with `lnt_`
- No server communication
- Files persist across sessions
