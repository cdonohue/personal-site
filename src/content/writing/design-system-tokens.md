---
title: "Design Systems Part 1: Tokens"
description: The foundation layer. How semantic tokens create a shared language between design and code.
date: 2024-12-01
image: /images/writing/design-system-tokens.svg
draft: true
---

Before you write a single component, your team needs to agree on a language. Not a programming language. A product language.

What does "primary" mean? What's the difference between "small" and "tight"? When someone says "muted," do they mean color, opacity, or font weight?

Design tokens answer these questions once, in one place. They're the smallest decisions in your system: colors, spacing, typography, shadows. Named in a way that carries intent, not just value.

## Format doesn't matter. Agreement does.

You can define tokens in CSS:

```css
:root {
  --color-primary: #0066cc;
  --color-muted: #6b7280;
  --space-tight: 0.5rem;
  --space-standard: 1rem;
}
```

Or in JavaScript/TypeScript:

```ts
export const tokens = {
  color: {
    primary: '#0066cc',
    muted: '#6b7280',
  },
  space: {
    tight: '0.5rem',
    standard: '1rem',
  },
};
```

The format is an implementation detail. What matters is that when a designer says "use the primary color with tight spacing," an engineer knows exactly what that means. No guessing. No eyeballing hex values from a Figma file.

## Semantic over literal

Literal tokens like `blue-500` or `spacing-4` are fine as a starting point. But they're just variables with extra steps.

The problem comes when things change. Your brand refreshes. Blue becomes teal. Now you're grepping through every file that references `blue-500`, deciding which ones should change and which shouldn't.

A semantic layer fixes this. Define your literals once, then derive semantic tokens from them:

```css
:root {
  /* Literals */
  --blue-500: #0066cc;
  --gray-400: #6b7280;

  /* Semantic */
  --color-primary: var(--blue-500);
  --color-muted: var(--gray-400);
}
```

Now you change `color-primary` in one place and everything follows.

Name tokens by their role:

| Avoid | Prefer |
|-------|--------|
| `blue-500` | `color-primary` |
| `gray-400` | `color-muted` |
| `spacing-2` | `space-tight` |
| `spacing-4` | `space-standard` |

Semantic names decouple the value from its meaning. You can change `color-primary` from blue to green without renaming anything. More importantly, semantic names communicate intent. A new team member reads `space-tight` and understands it without checking a scale.

## Tokens are a contract

Once your team agrees on tokens, they become the vocabulary of your product. Designers use them in Figma. Engineers use them in code. Product uses them in specs.

When everyone speaks the same language, fewer things get lost in translation.

---

Next: [Layout Components](/writing/design-system-layout) — structural primitives that know about tokens.
