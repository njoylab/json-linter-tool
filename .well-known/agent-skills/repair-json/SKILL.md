---
name: repair-json
description: Repair malformed JSON with JSONRepair, then return formatted valid JSON.
---

# Repair JSON

Use this skill when JSON is close to valid but contains common syntax defects.

## Preferred execution

If WebMCP is available, call `repair_json`.

## Typical fixes

- trailing commas
- single-quoted strings
- comments
- missing commas
- missing closing braces or brackets

## Result

Return repaired JSON formatted with 2-space indentation. If repair fails, return the error message.
