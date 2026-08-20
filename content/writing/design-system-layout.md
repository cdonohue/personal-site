---
title: "Design Systems Part 2: Layout Components"
description: Structural primitives that know about spacing. The bridge between tokens and UI.
date: 2024-12-02
image: /images/writing/design-system-layout.svg
draft: true
---

Once you have tokens, you need something that uses them. Layout components are the first consumer.

These components handle arrangement: `VStack`, `HStack`, `ZStack`, `Grid`, `Center`, and so on. They're the structural backbone of your UI, and the only layer that directly references spacing tokens.

## Spacing as a prop

A layout component takes a `gap` prop that maps to your token scale:

```tsx
function VStack({ gap = 'standard', children, style, ...props }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `var(--space-${gap})`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
```

Now spacing decisions are explicit. `<VStack gap="tight">` reads like intent, not implementation. And because it references tokens, the actual pixel value can change without touching component code.

## Common layout components

A minimal set to start:

| Component | Purpose |
|-----------|---------|
| `VStack` | Vertical flex with gap |
| `HStack` | Horizontal flex with gap |
| `ZStack` | Layered positioning via single-cell grid |
| `Grid` | CSS grid with token-based gaps |
| `Center` | Centers content horizontally and/or vertically |
| `Spacer` | Flexible space that pushes siblings apart |

You'll add more as patterns emerge. But start small.

## Escape hatches matter

Every layout component should accept a `style` prop, a `className`, or both. Systems that lock you in become obstacles.

```tsx
<VStack gap="standard" style={{ maxWidth: '400px' }}>
  {children}
</VStack>
```

The 80% case uses the system. The 20% that doesn't can still override without fighting it.

## No visual opinions

Layout components handle arrangement. They don't decide colors, borders, shadows, or typography. A `VStack` with a background color is doing too much. Keep these focused on structure.

---

Next: [Accessible Headless Primitives](/writing/design-system-primitives) — behavior without opinion.
