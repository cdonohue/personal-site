---
title: "Compound Components: When Props Get Out of Hand"
description: Replace boolean flags with composition. A quick guide to the compound component pattern.
date: 2025-12-05
draft: true
---

Too many props? Boolean flags controlling what renders? Time for compound components.

## The Smell

```tsx
<TextEditor
  showToolbar={true}
  showMergeField={true}
  showStyles={false}
  toolbarDisabled={false}
  // ...15 more props
/>
```

Boolean flags are a code smell. They mean "render this thing or don't." That's composition's job.

## The Fix

```tsx
<TextEditor value={html} onChange={setHtml}>
  <TextEditor.Toolbar>
    <TextEditor.Toolbar.Format />
    <TextEditor.Toolbar.Tokens values={tokens} />
  </TextEditor.Toolbar>
  <TextEditor.Content />
</TextEditor>
```

Don't want something? Don't render it.

## Portal Support for Free

Need the toolbar elsewhere? Use React:

```tsx
{createPortal(<TextEditor.Toolbar />, container)}
```

No special API. No refs.

## Hide Internal Types

Bad: Expose library internals

```tsx
initialValue: Value  // Slate's JSON format
```

Good: Simple boundary

```tsx
value: string  // HTML
```

Consumers shouldn't know what library you're using internally.

## When to Use This Pattern

✓ Consumers need different subsets of functionality
✓ Components need flexible positioning
✓ You're passing props just to forward them deeper

✗ Everyone uses the same configuration
✗ Simple components with few props

## The Tradeoff

More verbose when you need everything. Worth it when consumers have varying needs.
