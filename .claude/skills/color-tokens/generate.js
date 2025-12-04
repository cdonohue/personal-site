#!/usr/bin/env node

/**
 * Color Token Generator
 * Generates accessible color tokens from a single accent color
 */

const accentHex = process.argv[2];

if (!accentHex || !/^#[0-9A-Fa-f]{6}$/.test(accentHex)) {
  console.error('Usage: node generate.js <hex-color>');
  console.error('Example: node generate.js "#ed8008"');
  process.exit(1);
}

// ============================================================================
// Color Conversion Utilities
// ============================================================================

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0'))
    .join('');
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ============================================================================
// APCA Contrast Calculation
// ============================================================================

function linearize(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getLuminance(rgb) {
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

function getAPCAContrast(textRgb, bgRgb) {
  const Ytext = getLuminance(textRgb);
  const Ybg = getLuminance(bgRgb);
  const Lc = (Math.pow(Ybg, 0.56) - Math.pow(Ytext, 0.57)) * 1.14;
  return Math.abs(Lc) * 100;
}

// ============================================================================
// Gray Scale Generation
// ============================================================================

function getColorTemperature(hue) {
  if ((hue >= 0 && hue <= 60) || hue >= 300) return 'warm';
  if (hue >= 180 && hue <= 270) return 'cool';
  return 'neutral';
}

function generateGrayScale(accentHex) {
  const accentRgb = hexToRgb(accentHex);
  const accentHsl = rgbToHsl(accentRgb.r, accentRgb.g, accentRgb.b);
  const temp = getColorTemperature(accentHsl.h);

  let grayHue = 40;
  if (temp === 'warm') {
    grayHue = accentHsl.h * 0.3 + 40 * 0.7;
  } else if (temp === 'cool') {
    grayHue = accentHsl.h * 0.2 + 220 * 0.8;
  }

  const lightnesses = [97, 92, 85, 75, 60, 45, 32, 20, 12, 5];
  const saturations = [8, 10, 12, 14, 16, 18, 16, 14, 12, 10];

  return lightnesses.map((l, i) => {
    const rgb = hslToRgb(grayHue, saturations[i], l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });
}

// ============================================================================
// Accessible Text Color
// ============================================================================

function getAccessibleTextColor(accentHex, lightColor, darkColor) {
  const accentRgb = hexToRgb(accentHex);
  const lightRgb = hexToRgb(lightColor);
  const darkRgb = hexToRgb(darkColor);

  const lightContrast = getAPCAContrast(lightRgb, accentRgb);
  const darkContrast = getAPCAContrast(darkRgb, accentRgb);

  const useDark = darkContrast > lightContrast;
  const contrast = useDark ? darkContrast : lightContrast;
  const textColor = useDark ? darkColor : lightColor;

  return {
    color: textColor,
    contrast: contrast.toFixed(1),
    passes: contrast >= 60,
  };
}

// ============================================================================
// Generate Output
// ============================================================================

const grays = generateGrayScale(accentHex);
const textInfo = getAccessibleTextColor(accentHex, grays[0], grays[9]);

const gray8onGray1 = getAPCAContrast(hexToRgb(grays[7]), hexToRgb(grays[0]));
const gray9onGray1 = getAPCAContrast(hexToRgb(grays[8]), hexToRgb(grays[0]));

// Check accent AS TEXT on background (for links, icons)
const accentOnBg = getAPCAContrast(hexToRgb(accentHex), hexToRgb(grays[0]));
const accentOnBgPasses = accentOnBg >= 60;

console.log(`
/* ========================================================================
   ADAPTIVE GRAY SCALE
   Generated from accent: ${accentHex}
   ======================================================================== */

--gray-1: ${grays[0]};   /* App background */
--gray-2: ${grays[1]};   /* Surface/card background */
--gray-3: ${grays[2]};   /* Subtle borders */
--gray-4: ${grays[3]};   /* Standard borders */
--gray-5: ${grays[4]};   /* Disabled text */
--gray-6: ${grays[5]};   /* Placeholders (large text only) */
--gray-7: ${grays[6]};   /* Secondary text */
--gray-8: ${grays[7]};   /* Primary text */
--gray-9: ${grays[8]};   /* Headings */
--gray-10: ${grays[9]};  /* Maximum contrast */

/* ========================================================================
   FUNCTIONAL ACCENT
   ======================================================================== */

--accent: ${accentHex};
--accent-text: ${textInfo.color};  /* For text ON accent backgrounds */

/* ========================================================================
   ACCESSIBILITY REPORT
   ======================================================================== */

/*
 * TEXT ON ACCENT (buttons):
 *   Lc ${textInfo.contrast} ${textInfo.passes ? '✓' : '⚠ Below Lc 60'}
 *
 * ACCENT AS TEXT on Gray 1 (links, icons):
 *   Lc ${accentOnBg.toFixed(1)} ${accentOnBgPasses ? '✓' : '⚠ Below Lc 60 - DO NOT use for text'}
 *
 * GRAY TEXT:
 *   Gray 8 on Gray 1: Lc ${gray8onGray1.toFixed(1)} ${gray8onGray1 >= 60 ? '✓' : '⚠'}
 *   Gray 9 on Gray 1: Lc ${gray9onGray1.toFixed(1)} ${gray9onGray1 >= 60 ? '✓' : '⚠'}
 */
`);

if (!textInfo.passes) {
  console.log('⚠ Warning: Text on accent below Lc 60. Buttons may not be accessible.\n');
}

if (!accentOnBgPasses) {
  console.log('⚠ Warning: Accent as text color fails Lc 60.');
  console.log('  → Do NOT use accent for link text. Use underlines instead.\n');
}
