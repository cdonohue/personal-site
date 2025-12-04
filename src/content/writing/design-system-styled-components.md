---
title: "Design Systems Part 4: Styled Components"
description: Where tokens meet primitives. Composing visual identity with accessible behavior.
date: 2024-12-04
image: /images/writing/design-system-styled-components.svg
draft: true
---

This is where everything comes together. Styled components combine tokens, layout, and headless primitives into opinionated, reusable UI.

A `Button`. A `Card`. An `Input`. These are the building blocks teams reach for every day.

## Composition, not inheritance

A styled component wraps a primitive and applies your visual language:

```tsx
function Dialog({ open, onClose, children }) {
  return (
    <DialogPrimitive open={open} onClose={onClose}>
      <Card padding="layout" shadow="lg" radius="md">
        <VStack gap="standard">
          {children}
        </VStack>
      </Card>
    </DialogPrimitive>
  );
}
```

The primitive handles accessibility. Layout handles structure. Tokens handle the visual details. The styled component just wires them together.

## Variants over one-offs

Instead of creating `PrimaryButton`, `SecondaryButton`, `DangerButton`, use variants:

```tsx
function Button({ variant = 'primary', size = 'md', children, ...props }) {
  return (
    <button
      className={`button button--${variant} button--${size}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

One component, multiple expressions. Easier to maintain, easier to document, easier to use.

## Escape hatches

Styled components should accept `className` and `style` props. The system handles the common cases. When someone needs to nudge a margin or override a color, they can.

```tsx
<Button variant="primary" style={{ marginTop: 'auto' }}>
  Submit
</Button>
```

Don't fight the escape hatch. A system that blocks customization becomes a bottleneck.

## Keep the API small

Every prop you add is a prop you maintain. Start with the minimum:

- `variant` for visual variations
- `size` for scale
- Standard HTML attributes passed through

Add more only when patterns repeat across the codebase. If three teams ask for the same prop, it belongs in the system. If one person needs it once, that's what escape hatches are for.

---

Next: [Product Components](/writing/design-system-product-components) — the product layer.
