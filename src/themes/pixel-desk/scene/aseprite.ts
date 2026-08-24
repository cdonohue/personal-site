/**
 * Minimal loader for Aseprite's sprite-sheet JSON (`--data`, `--format json-array`).
 *
 * Handles both `json-array` (frames is a list) and `json-hash` (frames is an
 * object keyed by filename) so a sheet re-exported the other way still loads.
 */

export type Rect = { x: number; y: number; w: number; h: number };

type RawFrame = {
  filename?: string;
  frame: Rect;
  duration: number;
};

type RawTag = { name: string; from: number; to: number; direction?: string };

type RawSlice = {
  name: string;
  keys: { frame: number; bounds: Rect }[];
};

type RawSheet = {
  frames: RawFrame[] | Record<string, RawFrame>;
  meta: {
    size: { w: number; h: number };
    frameTags?: RawTag[];
    slices?: RawSlice[];
  };
};

export type Frame = { rect: Rect; duration: number };

export type Tag = { name: string; from: number; to: number };

/**
 * What a sheet draws from. A canvas as well as an image, because the character
 * is recoloured at load and the result of that is a canvas.
 */
export type SheetImage = HTMLImageElement | HTMLCanvasElement;

export class Sheet {
  readonly image: SheetImage;
  readonly frames: Frame[];
  readonly tags: Tag[];
  readonly slices: Map<string, Rect>;

  constructor(image: SheetImage, sheet: RawSheet) {
    this.image = image;

    const raw = Array.isArray(sheet.frames) ? sheet.frames : Object.values(sheet.frames);
    this.frames = raw.map((frame) => ({ rect: frame.frame, duration: frame.duration }));

    this.tags = (sheet.meta.frameTags ?? []).map(({ name, from, to }) => ({ name, from, to }));

    this.slices = new Map(
      (sheet.meta.slices ?? [])
        .filter((slice) => slice.keys.length > 0)
        .map((slice) => [slice.name, slice.keys[0].bounds] as const),
    );
  }

  /** Total duration of a frame range, in ms. */
  durationOf(from: number, to: number): number {
    let total = 0;
    for (let i = from; i <= to; i += 1) total += this.frames[i].duration;
    return total;
  }

  /**
   * Frame index at `elapsed` ms into a tag (or the whole sheet), looping.
   * Respects per-frame durations rather than assuming a fixed frame rate.
   */
  frameAt(elapsed: number, tagName?: string): number {
    const tag = tagName ? this.tag(tagName) : undefined;
    const from = tag ? tag.from : 0;
    const to = tag ? tag.to : this.frames.length - 1;

    const total = this.durationOf(from, to);
    if (total <= 0) return from;

    let remaining = ((elapsed % total) + total) % total;
    for (let i = from; i <= to; i += 1) {
      remaining -= this.frames[i].duration;
      if (remaining < 0) return i;
    }
    return to;
  }

  /**
   * Tag by name. Throws loudly — renaming a tag in Aseprite would otherwise
   * fall back to playing the whole sheet, which looks like a glitch rather
   * than a mistake. Same reasoning as slice().
   */
  tag(name: string): Tag {
    const tag = this.tags.find((candidate) => candidate.name === name);
    if (!tag) {
      const known = this.tags.map((candidate) => candidate.name).join(', ') || 'none';
      throw new Error(`Aseprite tag "${name}" not found. Tags in this sheet: ${known}`);
    }
    return tag;
  }

  /** Whether a tag exists, for sheets where tags are optional. */
  hasTag(name: string): boolean {
    return this.tags.some((candidate) => candidate.name === name);
  }

  /** Total run time of a tag, in ms. */
  tagDuration(name: string): number {
    return this.durationOf(this.tag(name).from, this.tag(name).to);
  }

  /**
   * Frame index at `elapsed` ms into a tag, held on the last frame instead of
   * looping. For one-shots like a monitor powering on, where the animation
   * should finish and stay finished.
   */
  frameOnce(elapsed: number, tagName: string): number {
    const tag = this.tag(tagName);

    let remaining = Math.max(0, elapsed);
    for (let i = tag.from; i <= tag.to; i += 1) {
      remaining -= this.frames[i].duration;
      if (remaining < 0) return i;
    }
    return tag.to;
  }

  /** Blit one frame with its top-left corner at (dx, dy). */
  draw(context: CanvasRenderingContext2D, index: number, dx: number, dy: number): void {
    const { rect } = this.frames[index];
    context.drawImage(this.image, rect.x, rect.y, rect.w, rect.h, dx, dy, rect.w, rect.h);
  }

  /** Slice bounds by name. Throws loudly — a renamed slice should not silently misplace art. */
  slice(name: string): Rect {
    const bounds = this.slices.get(name);
    if (!bounds) {
      const known = [...this.slices.keys()].join(', ') || 'none';
      throw new Error(`Aseprite slice "${name}" not found. Slices in this sheet: ${known}`);
    }
    return bounds;
  }
}

export const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });

/**
 * Load `<base>.png` + `<base>.json` as a Sheet.
 *
 * `transform` runs on the decoded image before the Sheet is built, for sheets
 * that are repainted rather than drawn as exported. Doing it here rather than
 * afterwards means nothing ever holds a Sheet whose pixels are about to change.
 */
export const loadSheet = async (
  base: string,
  transform?: (image: HTMLImageElement) => SheetImage,
): Promise<Sheet> => {
  const [image, response] = await Promise.all([loadImage(`${base}.png`), fetch(`${base}.json`)]);
  if (!response.ok) throw new Error(`Failed to load sheet data: ${base}.json`);
  return new Sheet(transform ? transform(image) : image, (await response.json()) as RawSheet);
};
