---
name: lint-json
description: Validate JSON and rewrite it as formatted JSON with 2-space indentation.
---

# Lint JSON

Use this skill when JSON should be parsed and normalized into valid pretty-printed output.

## Preferred execution

If WebMCP is available, call `lint_json`.

## Inputs

- `json`: Raw JSON string. If omitted, use the current editor content.

## Result

Return the formatted JSON string. If parsing fails, surface the parse error instead of guessing.
