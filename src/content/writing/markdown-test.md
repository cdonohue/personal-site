---
title: Markdown Component Test
description: A test post to preview all markdown components and how they render.
date: 2024-01-15
draft: true
---

This is a test post to preview how all markdown elements render. Use this as a reference for styling.

## Headings

Content after an h2. The heading above should have proper spacing.

### Third Level Heading

Content after an h3. These are useful for subsections.

#### Fourth Level Heading

Content after an h4. Rarely needed but good to have styled.

## Paragraphs and Inline Elements

This is a regular paragraph with some **bold text** and some *italic text*. You can also have ***bold and italic*** together. Here's some `inline code` for good measure.

Here's a second paragraph to show spacing between paragraphs. It contains a [link to somewhere](https://example.com) and another [internal link](/about) for comparison.

Sometimes you need to ~~strike through~~ text that's no longer relevant.

## Lists

### Unordered Lists

- First item in the list
- Second item with more content that might wrap to multiple lines if it's long enough to do so
- Third item
  - Nested item one
  - Nested item two
- Fourth item back at the top level

### Ordered Lists

1. First step in the process
2. Second step with details
3. Third step
   1. Sub-step one
   2. Sub-step two
4. Fourth step to finish

### Mixed Lists

1. First ordered item
   - Unordered nested
   - Another nested
2. Second ordered item

## Blockquotes

> This is a blockquote. It's often used for quotes or callouts. It should stand out from regular content but not be too aggressive.

> Multi-paragraph blockquotes work too.
>
> This is the second paragraph inside the quote.

## Code Blocks

Inline `code` was shown above. Here's a full code block:

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

const result = greet('World');
```

And one without syntax highlighting:

```
Plain code block
No language specified
Just preformatted text
```

## Horizontal Rules

Content before the rule.

---

Content after the rule.

## Tables

| Feature | Support | Notes |
|---------|---------|-------|
| Tables | Yes | Basic table support |
| Alignment | Partial | Left-align works |
| Complex | No | Keep tables simple |

## Images

![Placeholder image](https://via.placeholder.com/600x300/1a1a1a/666?text=Test+Image)

Images should be responsive and not overflow their container.

## Task Lists

- [x] Completed task
- [x] Another done item
- [ ] Todo item
- [ ] Another todo

## Footnotes

Here's a sentence with a footnote[^1].

[^1]: This is the footnote content.

## Summary

That covers most common markdown elements. Check each one for proper:

1. Typography (size, weight, color)
2. Spacing (margins, padding)
3. Responsiveness (mobile behavior)
4. Consistency (matches site design)
