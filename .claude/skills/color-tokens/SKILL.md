---
name: color-tokens
description: Generate accessible color tokens from a single accent color. Use when user wants to create or update color palettes, check accessibility contrast, or generate warm/cool adaptive gray scales.
allowed-tools: Read, Write, Edit, Bash
---

# Generate Color Tokens

Generate accessible color tokens from a single accent color following Dieter Rams' "Less, but better" philosophy.

## Usage

1. Ask user for the accent color (hex format, e.g., `#ed8008`)
2. Run: `node .claude/skills/color-tokens/generate.js "#hexcolor"`
3. Review output with user
4. Map the values into `src/index.css`

Step 4 is a mapping, not a paste. This was written for an earlier version of the
site whose palette was a `--gray-1` through `--gray-10` ramp in
`src/styles/tokens.css`. That file is gone. The site now uses six semantic
tokens in `src/index.css`, and its colours are sampled from the pixel scene
rather than derived from an accent, so the generator is a starting point and a
contrast checker rather than something to paste wholesale:

| generated | roughly corresponds to |
|---|---|
| `--gray-1` | `--color-surface` |
| `--gray-2` | `--color-sunken` |
| `--gray-3` | `--color-line` |
| `--gray-7` | `--color-muted` |
| `--gray-9` | `--color-ink` |
| `--accent` | `--color-accent` |

Whatever comes out has to clear 4.5:1 on its own background in both schemes.

## What It Generates

- 10 adaptive grays that harmonize with the accent (warm/cool/neutral)
- Accessible text color for the accent (light or dark based on APCA contrast)
- CSS custom properties ready to paste
- Accessibility contrast checks

## Example

```bash
node .claude/skills/color-tokens/generate.js "#ed8008"
```
