---
title: jq Playground
description: Run jq-style filters against JSON directly in the browser.
---

# jq Playground

Use the jq playground to test jq-style expressions against JSON locally in the browser.

## Common filters

- `.` returns the full input.
- `.key` extracts a property.
- `.[]` iterates array items.
- `map(.name)` maps a field from each item.
- `select(.active == true)` filters by condition.
- `sort_by(.name)` sorts array items by a field.

## Notes

- The implementation is a lightweight jq-compatible subset in `jq-lite.js`.
- Results are written back into the editor for follow-up formatting, copying, or sharing.
