---
name: minify-json
description: Remove whitespace from valid JSON and return a compact JSON string.
---

# Minify JSON

Use this skill when valid JSON should be compacted for transfer, embedding, or copy/paste.

## Preferred execution

If WebMCP is available, call `minify_json`.

## Inputs

- `json`: Raw JSON string. If omitted, use the current editor content.

## Result

Return compact JSON with no extra whitespace.
