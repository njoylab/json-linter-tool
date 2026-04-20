---
name: apply-jq-filter
description: Apply a jq-style filter to JSON using the in-browser jq-lite engine.
---

# Apply jq Filter

Use this skill when structured extraction or filtering is needed on JSON already loaded into the page.

## Preferred execution

If WebMCP is available, call `apply_jq_filter`.

## Inputs

- `json`: Raw JSON string. If omitted, use the current editor content.
- `query`: jq-style expression such as `.users`, `.[]`, `map(.name)`, or `select(.age > 18)`.

## Result

Return the filter result. Objects and arrays should be returned as formatted JSON. Primitive values should be returned as strings.
