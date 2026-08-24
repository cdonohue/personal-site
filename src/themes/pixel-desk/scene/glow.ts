/**
 * Pixel-grid bloom for sprite sheets.
 *
 * Canvas `shadowBlur` is the obvious tool and the wrong one here: it derives
 * the shadow from the alpha channel, and on the 7-segment digits every segment
 * is opaque — the unlit "burn-in" ones included. That would light up the ghost
 * segments. Instead we pick out the *emissive* pixels by brightness, dilate
 * them on the pixel grid, and composite the resulting rings additively.
 *
 * Rings use Manhattan distance, so the falloff is a diamond rather than a box.
 * At two pixels a box reads as a rectangle around each glyph; a diamond reads
 * as light.
 */

import type { Frame, SheetImage } from './aseprite';

export type GlowOptions = {
  /**
   * Fraction of the sheet's brightest pixel above which a pixel is treated as
   * emitting. Relative rather than absolute so re-tinting the palette (e.g.
   * dimming the burn-in grey) does not silently change what glows.
   */
  emissiveFraction?: number;
  /** Alpha per ring, outward from the glyph. Length sets the glow radius. */
  ringAlphas?: number[];
  /** Glow colour, additive over whatever is behind it. */
  color?: [number, number, number];
};

const DEFAULTS = {
  emissiveFraction: 0.6,
  /**
   * One ring only. The clock plate is 21x7 with a single pixel between glyphs,
   * so a two-pixel bloom closes those gaps and the readout turns to haze.
   */
  ringAlphas: [0.16],
  color: [168, 178, 190] as [number, number, number],
};

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

export class Glow {
  private readonly canvas: HTMLCanvasElement;
  readonly pad: number;
  private readonly cellW: number;
  private readonly cellH: number;
  private readonly alphas: number[];

  private constructor(
    canvas: HTMLCanvasElement,
    pad: number,
    cellW: number,
    cellH: number,
    alphas: number[],
  ) {
    this.canvas = canvas;
    this.pad = pad;
    this.cellW = cellW;
    this.cellH = cellH;
    this.alphas = alphas;
  }

  /**
   * Precompute glow rings for every frame. Frames must share one size — true
   * for a glyph sheet, and cheaper than packing variable cells.
   */
  static build(image: SheetImage, frames: Frame[], options: GlowOptions = {}): Glow {
    const emissiveFraction = options.emissiveFraction ?? DEFAULTS.emissiveFraction;
    const ringAlphas = options.ringAlphas ?? DEFAULTS.ringAlphas;
    const [cr, cg, cb] = options.color ?? DEFAULTS.color;

    const { w, h } = frames[0].rect;
    if (frames.some((frame) => frame.rect.w !== w || frame.rect.h !== h)) {
      throw new Error('Glow.build requires every frame to be the same size');
    }

    const source = document.createElement('canvas');
    source.width = image.width;
    source.height = image.height;
    const sourceContext = source.getContext('2d', { willReadFrequently: true });
    if (!sourceContext) throw new Error('Glow.build could not get a 2d context');
    sourceContext.drawImage(image, 0, 0);
    const sheet = sourceContext.getImageData(0, 0, image.width, image.height);

    // Relative threshold, measured over the whole sheet.
    let brightest = 0;
    for (let i = 0; i < sheet.data.length; i += 4) {
      if (sheet.data[i + 3] === 0) continue;
      brightest = Math.max(brightest, luma(sheet.data[i], sheet.data[i + 1], sheet.data[i + 2]));
    }
    const threshold = brightest * emissiveFraction;

    const pad = ringAlphas.length;
    const cellW = w + pad * 2;
    const cellH = h + pad * 2;

    const out = document.createElement('canvas');
    out.width = cellW * frames.length;
    out.height = cellH * ringAlphas.length;
    const outContext = out.getContext('2d');
    if (!outContext) throw new Error('Glow.build could not get a 2d context');
    const target = outContext.createImageData(out.width, out.height);

    frames.forEach((frame, index) => {
      // Manhattan distance from the nearest emissive pixel, over the padded cell.
      const distance = new Int16Array(cellW * cellH).fill(Number.MAX_SAFE_INTEGER);
      const queue: number[] = [];

      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const s = ((frame.rect.y + y) * image.width + (frame.rect.x + x)) * 4;
          if (sheet.data[s + 3] === 0) continue;
          if (luma(sheet.data[s], sheet.data[s + 1], sheet.data[s + 2]) < threshold) continue;
          const at = (y + pad) * cellW + (x + pad);
          distance[at] = 0;
          queue.push(at);
        }
      }

      for (let head = 0; head < queue.length; head += 1) {
        const at = queue[head];
        const d = distance[at];
        if (d >= pad) continue;
        const x = at % cellW;
        const y = (at - x) / cellW;
        const neighbours = [
          x > 0 ? at - 1 : -1,
          x < cellW - 1 ? at + 1 : -1,
          y > 0 ? at - cellW : -1,
          y < cellH - 1 ? at + cellW : -1,
        ];
        for (const next of neighbours) {
          if (next < 0 || distance[next] <= d + 1) continue;
          distance[next] = d + 1;
          queue.push(next);
        }
      }

      ringAlphas.forEach((_, ring) => {
        const ringDistance = ring + 1;
        for (let y = 0; y < cellH; y += 1) {
          for (let x = 0; x < cellW; x += 1) {
            if (distance[y * cellW + x] !== ringDistance) continue;
            const t = ((ring * cellH + y) * target.width + (index * cellW + x)) * 4;
            target.data[t] = cr;
            target.data[t + 1] = cg;
            target.data[t + 2] = cb;
            target.data[t + 3] = 255;
          }
        }
      });
    });

    outContext.putImageData(target, 0, 0);
    return new Glow(out, pad, cellW, cellH, ringAlphas);
  }

  /**
   * Draw the glow for one frame. `dx`/`dy` are the glyph's top-left; the glow
   * extends `pad` pixels beyond it on every side.
   */
  draw(context: CanvasRenderingContext2D, index: number, dx: number, dy: number): void {
    const previousAlpha = context.globalAlpha;
    const previousOperation = context.globalCompositeOperation;
    context.globalCompositeOperation = 'lighter';

    this.alphas.forEach((alpha, ring) => {
      context.globalAlpha = alpha;
      context.drawImage(
        this.canvas,
        index * this.cellW,
        ring * this.cellH,
        this.cellW,
        this.cellH,
        dx - this.pad,
        dy - this.pad,
        this.cellW,
        this.cellH,
      );
    });

    context.globalAlpha = previousAlpha;
    context.globalCompositeOperation = previousOperation;
  }
}
