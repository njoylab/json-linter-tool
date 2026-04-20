---
title: JSON Linter, Formatter, and Fixer
description: Browser-based JSON linting, repair, minification, and jq-style filtering.
---

# JSON Linter, Formatter, and Fixer

Fix invalid JSON, validate parse errors, format payloads, minify output, and run jq-style filters in the browser.

## Key actions

- Lint JSON: parse the current JSON and pretty-print it with 2-space indentation.
- Repair JSON: fix common issues such as trailing commas, single quotes, comments, and missing commas or brackets.
- Minify JSON: remove whitespace from valid JSON.
- Apply jq filter: run jq-like queries such as `.users`, `.[]`, `map(.name)`, or `select(.age > 18)`.
- Share JSON: generate a URL with compressed JSON in the `json` query parameter.

## Browser behavior

- All processing is client-side.
- JSON entered in the editor is not uploaded by the application.
- Saved files are stored in browser local storage with the `lnt_` prefix.

## WebMCP tools

When the browser exposes `navigator.modelContext`, the page registers these tools:

- `lint_json`
- `repair_json`
- `minify_json`
- `apply_jq_filter`

## Useful URLs

- Homepage: https://jsonlint.echovalue.dev/
- jq playground: https://jsonlint.echovalue.dev/jq-playground/
- Agent skills index: https://jsonlint.echovalue.dev/.well-known/agent-skills/index.json
