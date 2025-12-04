---
title: "Design Systems Part 3: Accessible Headless Primitives"
description: Behavior without opinion. Building accessible components that don't impose styling.
date: 2024-12-03
image: /images/writing/design-system-primitives.svg
draft: true
---

Accessibility is hard to bolt on later. It's easier when you build it into the foundation.

Headless primitives are components that handle behavior and accessibility, but have no visual opinion. No colors. No spacing. No borders. Just the right ARIA attributes, keyboard interactions, and focus management baked in.

## One place to get it right

When accessibility lives in a shared primitive, you fix it once and everything benefits. A bug in your `Dialog` primitive? Fix it in one place. Every dialog in your app is now correct.

Compare this to scattering accessibility logic across dozens of one-off implementations. Each modal, each dropdown, each tooltip doing its own thing. Some remember to trap focus. Some don't. Some handle Escape. Some forget.

Primitives centralize that responsibility.

## No visual opinions

A headless primitive renders behavior, not appearance. Here's a simplified dialog:

```tsx
function DialogPrimitive({ open, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open) {
      dialog?.showModal();
    } else {
      dialog?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === dialogRef.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
```

No classes. No styles. Just the correct semantics. Focus trapping, Escape to close, and backdrop behavior come from the native `<dialog>` element. The consumer decides how it looks.

## Build or borrow

You don't have to write these yourself. Libraries like Radix, React Aria, and Headless UI have done the hard work. Use them. The goal isn't to reinvent accessibility—it's to have a single layer that owns it.

---

Next: [Styled Components](/writing/design-system-styled-components) — where tokens meet primitives.
