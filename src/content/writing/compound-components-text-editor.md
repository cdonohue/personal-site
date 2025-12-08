---
title: "Refactoring a Text Editor with Compound Components"
description: A case study on extracting a messy rich text editor into a composable, maintainable package.
date: 2025-12-05
draft: true
---

Our text editor had grown into a monster. Eighteen props. Boolean flags everywhere. Internal implementation details leaking into every consumer. It was time for surgery.

## The Problem

The original `TextEditor` component started simple. Then it needed a toolbar. Then merge fields for email templates. Then color pickers with organization-specific palettes. Then conditional toolbar sections based on context.

Every new feature added more props:

```tsx
type TextEditorProps = {
  initialValue: Value;              // Slate JSON - leaks internal format
  readOnly?: boolean;
  showToolbar?: boolean;            // Boolean flag
  toolbarRef?: RefObject<HTMLElement>;
  style?: EditableProps['style'];
  centered?: boolean;
  showMergeField?: boolean;         // Boolean flag
  mergeFieldValues?: Array<[string, string]>;
  showStyles?: boolean;             // Boolean flag
  menuPlacement?: MenuPlacement;
  toolbarDisabled?: boolean;        // Boolean flag
  isControlled?: boolean;
  zIndex?: number;
  palette?: Array<ColorPaletteItem>;
  onPaletteChange?: (palette) => void;
  onDuplicateColor?: (color) => void;
  onBlur?: (event, value: Value) => void;
  onFocus?: FocusEventHandler;
  onKeyDown?: KeyboardEventHandler;
  onSave?: (event, value: Value) => void;
};
```

Using it looked like this:

```tsx
<TextEditor
  initialValue={slateJson}
  showToolbar={true}
  toolbarRef={containerRef}
  showMergeField={true}
  mergeFieldValues={tokens}
  showStyles={false}
  toolbarDisabled={false}
  menuPlacement="bottom"
  zIndex={1000}
  palette={colors}
  onPaletteChange={setPalette}
  onBlur={handleBlur}
  onSave={handleSave}
/>
```

Three things bothered me:

1. **Boolean flags control structure.** `showToolbar`, `showMergeField`, `showStyles`—these tell the component what to render instead of letting the consumer compose what they need.

2. **Internal types leak.** The `Value` type is Slate's internal JSON format. Consumers had to understand Slate to use this component. They shouldn't need to.

3. **Positioning requires refs.** Want to render the toolbar in a different location? Pass a `toolbarRef`. It works, but it's awkward.

## The Solution: Compound Components

The new API uses composition instead of configuration:

```tsx
// Simple case
<TextEditor value={html} onChange={setHtml} />

// Custom toolbar
<TextEditor value={html} onChange={setHtml}>
  <TextEditor.Toolbar>
    <TextEditor.Toolbar.Format />
    <TextEditor.Toolbar.Colors palette={colors} onPaletteChange={setPalette} />
    <TextEditor.Toolbar.Tokens values={tokens} />
  </TextEditor.Toolbar>
  <TextEditor.Content onKeyDown={handleKeyDown} />
</TextEditor>
```

No boolean flags. Want merge fields? Render `<TextEditor.Toolbar.Tokens />`. Don't want them? Don't render it. The component doesn't know or care.

### Portal Support Comes Free

Need the toolbar in a different part of the DOM? Use React's built-in `createPortal`:

```tsx
<TextEditor value={html} onChange={setHtml}>
  {createPortal(<TextEditor.Toolbar />, toolbarContainer)}
  <TextEditor.Content />
</TextEditor>
```

No special API. No refs. Just React.

## Design Decision: HTML-in, HTML-out

The old component exposed Slate's JSON format:

```tsx
onBlur={(event, value: Value) => {
  // Consumer has to serialize to HTML
  const html = serializeToHtml(value);
  saveToDatabase(html);
}}
```

The new component takes and returns HTML strings:

```tsx
<TextEditor value={html} onChange={setHtml} />
```

Simpler for consumers. They don't need to know we're using Slate internally. If we ever swap to a different editor library, the API stays the same.

The tradeoff is performance—we serialize and deserialize on every change. In practice, for typical document sizes, it's imperceptible. And the API clarity is worth it.

### When You Need JSON

Some contexts genuinely need structured data. Form builders, for example, might want to store rich text as JSON for easier querying.

The consumer handles the conversion:

```tsx
function FormBuilderTextEditor({ value, onChange }) {
  const [html, setHtml] = useState(() => jsonToHtml(value));

  function handleChange(newHtml: string) {
    setHtml(newHtml);
    onChange(htmlToJson(newHtml));
  }

  return <TextEditor value={html} onChange={handleChange} />;
}
```

The conversion logic lives in the consumer, not the shared component. Different consumers can use different JSON formats. The editor doesn't need to know.

## Composable Toolbar Sections

The toolbar breaks down into composable sections:

- **Format** — Bold, italic, underline
- **Typography** — Font family, font size, headings
- **Colors** — Text color, background color with palette
- **Alignment** — Left, center, right, justify
- **Lists** — Bullets, numbered lists
- **Link** — Insert and edit links
- **Tokens** — Merge field insertion

Each section is independent. Build exactly the toolbar you need:

```tsx
<TextEditor.Toolbar>
  <TextEditor.Toolbar.Format />
  <TextEditor.Toolbar.Alignment />
</TextEditor.Toolbar>
```

Or use the default that includes everything:

```tsx
<TextEditor.Toolbar />
```

## What Remained Coupled

Not everything got extracted cleanly. The color picker still depends on organization-level color palettes. Users can save colors to their org's palette while editing.

This required keeping the palette data types and helper functions (`addColor`, `updateColor`) in the package. The palette itself is passed in as a prop—consumers handle fetching and persisting. But the manipulation logic lives in the editor package.

It's a pragmatic compromise. The alternative was duplicating palette logic across every consumer or creating yet another package for just two functions.

## The Result

Props went from 18 to 3 for simple cases. Boolean flags disappeared. Slate internals are hidden. Toolbar positioning uses standard React patterns.

More importantly, adding new toolbar sections doesn't touch the core component anymore. Each section is isolated. Test it independently. Ship it when ready.

The compound component pattern isn't always the right choice—it's more verbose when you need everything. But when consumers have varying needs, composition beats configuration.
