const fonts = {
  title: 'Fonts',
  description:
    'Each array of fonts creates a priority-based order. The first font in the array should be the ideal font, followed by sensible, web-safe fallbacks',
  items: [
    {
      name: 'Base',
      description: 'System fonts for body copy and globally set text.',
      value: [
        'ui-sans-serif',
        'system-ui',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
      ],
    },
    {
      name: 'Mono',
      description:
        'Monospaced fonts for terminal outputs, keyboard shortcuts, commands, etc',
      value: [
        'ui-monospace',
        'Cascadia Code',
        'Source Code Pro',
        'Menlo',
        'Consolas',
        'DejaVu Sans Mono',
        'monospace',
      ],
    },
  ],
}

export { fonts }
