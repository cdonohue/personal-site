---
title: "Design Systems Part 5: Product Components"
description: The product layer. Domain-specific components built on the system foundation.
date: 2024-12-05
image: /images/writing/design-system-product-components.svg
draft: true
---

Product components are where your design system meets your domain. These aren't generic building blocks. They're specific to what your product does.

`UserCard`. `InvoiceTable`. `SignatureField`. `DocumentPreview`.

These components encode business logic, not just visual patterns.

## Built on the system

A product component composes styled components and layout, but adds domain knowledge:

```tsx
function UserCard({ user, onSelect }) {
  return (
    <Card variant="interactive" onClick={() => onSelect(user)}>
      <HStack gap="standard" align="center">
        <Avatar src={user.avatar} name={user.name} />
        <VStack gap="tight">
          <Text weight="medium">{user.name}</Text>
          <Text size="sm" muted>{user.role}</Text>
        </VStack>
      </HStack>
    </Card>
  );
}
```

The system provides `Card`, `HStack`, `VStack`, `Avatar`, and `Text`. The product component decides what a "user card" means in your product.

## Opinionated by design

Product components should be opinionated. They exist to enforce consistency in how your product represents specific concepts.

Every user card should look the same. Every invoice table should behave the same. That's the point.

## Escape hatches: use sparingly

Unlike styled components, product components should resist customization. If every `UserCard` can look different, you don't have a system—you have a suggestion.

Expose only what needs to vary:

```tsx
function UserCard({ user, onSelect, showRole = true }) {
  // ...
}
```

A boolean flag for optional content. A callback for interaction. That's usually enough.

If someone needs a completely different user card, maybe they need a different component—not more props on this one.

## Where product components live

These don't belong in your design system package. They live in your app, close to the features that use them. They import from the system, but they're not part of it.

The design system provides the vocabulary. Product components write the sentences.

---

That's the full stack: tokens → layout → primitives → styled components → product components. Each layer builds on the last. Each has a clear responsibility. When something breaks, you know where to look.
