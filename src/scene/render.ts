import { Sheet, loadImage, loadSheet } from './aseprite';
import type { Frame } from './aseprite';
import { Glow } from './glow';
import { WEATHER_CONDITIONS, type Daylight, type ToggleValues, type Weather } from './toggles';
import { OUTFITS, inkStencil, recolour, type Outfit } from './outfits';
import { FALLBACK_SCREEN_TAG, effectsForScreen } from './screens';
import {
  SHEET_ASSETS,
  SKY_VARIANTS,
  artPath,
  roomLayerPath,
  roomVariantPath,
  skyPath,
} from './art';
export { PLAY_TAGS, SCREEN_TAGS, SCREENSAVER_TAGS, WORK_TAGS } from './screens';

/**
 * How the sky moves, in pixels per second. Motion comes from scrolling one
 * tileable frame rather than from more frames, so speed is a number here rather
 * than a frame rate baked into the art.
 *
 * Fog is deliberately still — it is a dithered haze, and drifting it would read
 * as a moving screen door rather than as weather.
 */
type SkyPass = {
  /** Fraction of the base speed this pass travels at. */
  speed: number;
  alpha: number;
  /** Pixel offset, so a slower pass does not sit exactly on top of a faster one. */
  shift: [number, number];
};

/**
 * How the sky moves, in pixels per second, and in how many depths.
 *
 * Motion comes from scrolling one tileable frame rather than from more frames,
 * so speed is a number here rather than a frame rate baked into the art.
 *
 * `passes` draws that frame more than once at different speeds. With a single
 * pass every drop moves in lockstep and the whole field slides as one rigid
 * sheet, which reads as a moving texture rather than as falling rain. A second,
 * slower, dimmer pass — shifted so it does not overlay the first — breaks that
 * up and gives depth without any extra art.
 *
 * Fog is deliberately still; drifting a dithered haze reads as a moving screen
 * door rather than as weather.
 */
const ONE_PASS: SkyPass[] = [{ speed: 1, alpha: 1, shift: [0, 0] }];

/**
 * Three depths for rain. Shifts are coprime-ish so the passes never line up
 * into a visible doubling — without them a slower pass sits directly on top of
 * a faster one and reads as a smear rather than as distance.
 */
/**
 * Speeds are bunched toward the top rather than spread from 0.3, so even the
 * furthest layer is clearly falling. A slow far pass under a fast near one
 * reads as drizzle behind a downpour rather than as one shower with depth.
 */
const RAIN_PASSES: SkyPass[] = [
  { speed: 0.45, alpha: 0.18, shift: [61, 29] },
  { speed: 0.58, alpha: 0.28, shift: [113, 71] },
  { speed: 0.72, alpha: 0.42, shift: [37, 53] },
  { speed: 0.86, alpha: 0.62, shift: [149, 17] },
  { speed: 1, alpha: 1, shift: [0, 0] },
];

/** Layered veils, so the banks overlap into varying density rather than a mat. */
const FOG_PASSES: SkyPass[] = [
  { speed: 0.4, alpha: 0.5, shift: [89, 41] },
  { speed: 1, alpha: 0.6, shift: [0, 0] },
];

/** Snow stays shallower: flakes are chunkier, so they clot faster than drops. */
const SNOW_PASSES: SkyPass[] = [
  { speed: 0.4, alpha: 0.3, shift: [61, 29] },
  { speed: 0.65, alpha: 0.55, shift: [37, 53] },
  { speed: 1, alpha: 1, shift: [0, 0] },
];

type Drift = { x: number; y: number };

/**
 * Day and night drift separately, because the pair is different art rather than
 * the same art tinted. Clouds move; stars do not — a star field sliding
 * sideways reads as the room turning, not as weather.
 */
const SKY_MOTION: Record<Weather, { day: Drift; night: Drift; alpha: number; passes: SkyPass[] }> =
  {
    clear: { day: { x: 1.5, y: 0 }, night: { x: 0, y: 0 }, alpha: 1, passes: ONE_PASS },
    overcast: { day: { x: 1, y: 0 }, night: { x: 1, y: 0 }, alpha: 1, passes: ONE_PASS },
    // Fog drifts. Held still it reads as something stuck to the glass rather
    // than weather behind it — slow enough to be barely perceptible.
    fog: { day: { x: 1.2, y: 0.15 }, night: { x: 1.2, y: 0.15 }, alpha: 1, passes: FOG_PASSES },
    // Straight down. The streaks are drawn vertical, and any horizontal motion
    // here would make them slide across the window rather than fall down it.
    rain: { day: { x: 0, y: 92 }, night: { x: 0, y: 92 }, alpha: 1, passes: RAIN_PASSES },
    // 8px/s took a flake 13 seconds to cross the window, which read as frozen.
    snow: { day: { x: 3, y: 20 }, night: { x: 3, y: 20 }, alpha: 1, passes: SNOW_PASSES },
  };

/**
 * The weather sheet holds a day frame and a night frame for each condition, in
 * the same order, so the night of condition N is frame N + this.
 *
 * Night is drawn art rather than a tint. Clear night has no clouds at all — it
 * has stars — and no amount of darkening a cloud turns it into one.
 */
const NIGHT_FRAME_OFFSET = WEATHER_CONDITIONS.length;

export const SCENE_WIDTH = 192;
export const SCENE_HEIGHT = 108;

/**
 * Frames 0–9 are the digit of the same value; 10 and 11 are the lit and dim
 * colon; 12 is a cell with every segment unlit, for the blanked leading digit.
 */
const COLON_LIT_FRAME = 10;
const COLON_DIM_FRAME = 11;
const DIGIT_BLANK_FRAME = 12;

/**
 * The highest the desktop can physically go, in scene pixels.
 *
 * Set by the art, not by taste. The inner post can slide 17px out of the middle
 * sleeve and the sleeve 7px out of the fixed one, and each joint keeps 3px of
 * overlap so it still reads as a column: 14 + 4. Past about 20 the joints run
 * out of overlap and the leg visibly comes apart, so this is a hard clamp
 * rather than a suggestion.
 */
export const DESK_MAX = 18;

/**
 * Where the desk comes to rest when raised.
 *
 * Deliberately short of the maximum, and by a measured amount rather than a
 * guess. The spring's natural peak from here is 17.5, which clears the 18px
 * ceiling: the clamp stays a safety net instead of becoming the behaviour. At
 * 15 the arc peaked at 18.8 and was chopped off mid-bounce, which reads as the
 * desk hitting something rather than as a spring settling.
 */
export const DESK_RAISED = 14;

/**
 * How far right the chair travels to leave the shot, in scene pixels.
 *
 * Measured, not chosen. The chair's left edge sits at x78, and the scene is
 * 192 wide, so 114 is the exact distance at which its last column clears the
 * frame. Anything less leaves a sliver of armrest parked on the edge, which
 * reads as a clipping bug rather than as a chair that has been pushed away.
 *
 * It is a long way, and knowingly so: it crosses the right leg, the power box
 * and the lower half of the right window on the way out. All three are behind
 * it, so the occlusion is free — the cost is time, which is why the travel is
 * the longest single beat in the sequence.
 */
export const CHAIR_EXIT = 114;

/**
 * The middle sleeve's share of the maximum travel.
 *
 * The stages have different strokes, so moving them at the same rate would run
 * the sleeve out of room while the post still had 10px left, and the column
 * would visibly come apart. Proportional to stroke means both joints move for
 * the whole journey and both arrive at their limit together.
 */
const LEGS_MID_SHARE = 4 / 18;

/**
 * The desk's power cable, drawn rather than exported.
 *
 * It runs from the plug along the floor and stops at the foot of the near desk
 * leg, where the leg covers its end — the rest of the run is understood to go
 * up inside the column, as it does on a real desk.
 *
 * Drawn rather than exported because the plug end moves: it drops to the floor
 * when pulled, and a sprite would need a frame for every point of that fall.
 *
 * Earlier versions carried it all the way up to the desk underside, first as a
 * hanging curve and then as a coil. Both had the same problem — a cable
 * crossing open wall is a strong diagonal in the middle of the frame, and it
 * competed with the desk rather than supporting it. Stopping at the leg says
 * the same thing and shows less.
 */
const CABLE_FROM = { x: 11, y: 89 };

/**
 * Where the plug ends up once it is pulled. Straight down onto the floor and a
 * little clear of the wall, as a plug on a stiff cable does.
 */
const CABLE_FALLEN = { x: 14, y: 95 };

/** The row the run lies on, one above the floor line at y96. */
const CABLE_FLOOR = 95;

/**
 * Where it disappears. The leg's foot spans x46–53, so ending inside that
 * covers the end rather than leaving it stopping in open floor.
 */
const CABLE_END = 48;

const CABLE_COLOUR = '#3a3a3e';

/**
 * The indicator on the power box under the right of the desk.
 *
 * Only the lit state is drawn here; unlit it is a dark lens in the art, which
 * dims with the room as a dead lamp should. Lit, it is painted after the
 * lighting wash so it keeps its brightness in a dark room — the same treatment
 * the monitor and the clock get, and for the same reason: it is a light source,
 * not a surface catching light.
 *
 * It rides the desk, so its position takes the same offset.
 */
const POWER_LED = { x: 125, y: 73 };
const POWER_LED_COLOUR = '#bacaff';

/** One emissive pixel inside the webcam body, padded one pixel from its right edge. */
const CAMERA_LED = { x: 98, y: 23 };

/** switch.aseprite frames are states, not a timeline. */
const SWITCH_OFF_FRAME = 0;
const SWITCH_ON_FRAME = 1;

/**
 * The clock plate is 21x7 and each glyph is 3x5, which lays out exactly as
 * 1px padding + five 3px glyphs separated by 1px gaps + 1px padding.
 */
const GLYPH_ADVANCE = 4;
const CLOCK_PADDING_X = 1;
const CLOCK_PADDING_Y = 1;

/**
 * Bloom around the lit segments. Parked — see glow.ts. Per-segment bloom does
 * not suit glyphs 3px wide with 1px gaps; backlight bleed is the fit.
 */
const DIGIT_GLOW = false;

/**
 * How much of the dark mask each combination applies.
 *
 * The room light and the time of day drive the *same* mask, so they have to
 * resolve to one opacity rather than stacking two washes — otherwise night with
 * the lights off double-darkens to near black.
 *
 * Night no longer has to carry its whole signal here: the window exterior swaps
 * to room.night.png, so the glass goes dark on its own. That frees night with
 * the lamp on to be a *lit* room with dark windows rather than just a dimmer
 * room, which is what made it indistinguishable from day with the lamp off.
 */
const WASH = {
  day: { on: 0, off: 0.55 },
  night: { on: 0.28, off: 0.8 },
};

/**
 * Interpolated by how far into night it is, so dusk dims the room gradually
 * rather than snapping when the phase changes.
 */
export const washFor = (lightsOn: boolean, nightAmount: number): number => {
  const key = lightsOn ? 'on' : 'off';
  return WASH.day[key] + (WASH.night[key] - WASH.day[key]) * nightAmount;
};

/**
 * Formatters are cached: the clock is read every frame, and building an
 * Intl.DateTimeFormat is far more expensive than using one.
 */
const formatters = new Map<string, Intl.DateTimeFormat>();

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * The clock the scene runs on, split into parts.
 *
 * With no `timeZone` this is the viewer's own clock, which is what a portable
 * scene should default to. A host that wants the room to keep somebody else's
 * hours passes one — and it has to be a zone name rather than an offset, or the
 * room is an hour wrong either side of a daylight-saving change.
 */
export const zonedParts = (
  date: Date,
  timeZone?: string,
): { hour: number; minute: number; second: number; weekday: number } => {
  if (!timeZone) {
    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      weekday: date.getDay(),
    };
  }

  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      // h23 rather than hour12: false — the latter reports midnight as 24.
      hourCycle: 'h23',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }

  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) parts[part.type] = part.value;

  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS[parts.weekday] ?? date.getDay(),
  };
};

/**
 * How far either side of sunrise and sunset the room takes to change over.
 *
 * Not symmetric, because dusk is not the reverse of dawn: the sky keeps some
 * light for a while after the sun has gone and has almost none before it
 * arrives. Half an hour before sunset to an hour after covers civil twilight
 * with a little either side, which is about when a room stops being usable
 * without a lamp.
 */
const DAWN_LEAD = 1;
const DAWN_TRAIL = 0.5;
const DUSK_LEAD = 0.5;
const DUSK_TRAIL = 1;

/**
 * Used when nothing has been fetched. With the leads above it gives dawn
 * 05:30–07:00 and dusk 18:00–19:30 — roughly Houston's equinox.
 *
 * A fixed pair was the whole model once, and it was only defensible for a few
 * weeks a year: the sun sets at 20:26 here in June and 17:25 in December, so
 * any single answer is over an hour wrong for most of it. Kept as the offline
 * case because a fixed curve is wrong by a bounded amount and a missing one is
 * wrong by half a day.
 */
const FALLBACK_DAYLIGHT: Daylight = { sunrise: 6.5, sunset: 18.5 };

/**
 * Local time to how night it is, 0..1.
 *
 * Smoothstepped rather than linear so the ramps ease in and out at the phase
 * boundaries. No hard swap at a boundary, and a linear ramp still changes
 * direction abruptly at each end even though the value itself is continuous.
 */
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export const nightAmountAt = (date: Date, timeZone?: string, daylight?: Daylight | null): number => {
  const at = zonedParts(date, timeZone);
  const hour = at.hour + at.minute / 60 + at.second / 3600;
  const { sunrise, sunset } = daylight ?? FALLBACK_DAYLIGHT;

  const dawnStart = sunrise - DAWN_LEAD;
  const dawnEnd = sunrise + DAWN_TRAIL;
  const duskStart = sunset - DUSK_LEAD;
  const duskEnd = sunset + DUSK_TRAIL;

  if (hour < dawnStart) return 1;
  if (hour < dawnEnd) return 1 - smoothstep((hour - dawnStart) / (dawnEnd - dawnStart));
  if (hour < duskStart) return 0;
  if (hour < duskEnd) return smoothstep((hour - duskStart) / (duskEnd - duskStart));
  return 1;
};

/** The scene's night level for a lighting mode: auto reads the clock. */
export const nightAmountFor = (
  lighting: 'auto' | 'day' | 'night',
  now: Date,
  timeZone?: string,
  daylight?: Daylight | null,
): number =>
  lighting === 'auto' ? nightAmountAt(now, timeZone, daylight) : lighting === 'night' ? 1 : 0;

/** Which character tag each presence state plays, seated. */
export const PRESENCE_TAG: Record<ToggleValues['presence'], string> = {
  present: 'idle',
  typing: 'type',
  away: 'away',
  empty: 'empty',
};

/**
 * Which tag the character should play, and whether it plays once.
 *
 * Split out and given a plain predicate instead of a Sheet so it can be
 * exercised without a canvas. It is worth that: the fallback chain here has
 * been wrong twice, and both times the symptom was the whole sheet playing —
 * idle, the empty chair, the startle and both transitions in a loop — which
 * reads as the scene being broken rather than as a pose being missing.
 *
 * Candidates are tried in order and the first the sheet actually has wins.
 * Falling back to `PRESENCE_TAG[presence]` is what went wrong before: for a
 * presence whose pose is undrawn that is the same missing name again, so the
 * chain never terminated anywhere real. The seated idle is the one pose that
 * must exist, so it anchors the end.
 *
 * `undefined` means even that is gone, which is a sheet worth noticing.
 */
export const characterTag = (
  has: (tag: string) => boolean,
  presence: ToggleValues['presence'],
  posture: Posture,
  oneShot?: string,
): { tag: string | undefined; once: boolean } => {
  if (oneShot && has(oneShot)) return { tag: oneShot, once: true };
  // Standing is only a pose for somebody who is here. Away is the empty chair
  // whichever way the desk is, so posture must not override it.
  const wanted = posture === 'standing' && presence === 'present' ? STANDING_TAG : undefined;
  const candidates = [wanted, PRESENCE_TAG[presence], PRESENCE_TAG.present];
  return {
    tag: candidates.find((candidate): candidate is string => Boolean(candidate) && has(candidate!)),
    once: false,
  };
};

/**
 * Whether the occupant is in the chair or on their feet.
 *
 * A second axis rather than two more presence values, because it is orthogonal
 * to all four of them and folding it in would double a table that is already a
 * lookup. It only reads `standing` while somebody is here: the transitions that
 * reach it are gated on presence, so an empty room never gets there.
 */
export type Posture = 'seated' | 'standing';

/** The standing idle pose. */
export const STANDING_TAG = 'standing';

/**
 * The two transitions, keyed by the posture they arrive at.
 *
 * Separate animations rather than one played backwards. Standing up is a push
 * off the seat and sitting down is a controlled drop, and the reversed frames
 * of either read as the other run in rewind.
 */
export const POSTURE_TAG: Record<Posture, string> = {
  standing: 'stand-up',
  seated: 'sit-down',
};

/**
 * The startle when the power goes, which is a different drawing on your feet
 * than in a chair.
 *
 * Seated it is mostly the marks doing the work, because the chair hides the
 * legs. Standing the hop is a translation of the whole figure, and the two
 * pixels of floor that open up under the shoes are what make it a jump.
 */
export const STARTLE_TAG: Record<Posture, string> = {
  seated: 'surprised',
  standing: 'surprised-standing',
};

/**
 * The chair's own reaction to being pushed off.
 *
 * Only on the way out. Going back it is being pulled into place by hand, which
 * is a controlled movement with nothing to react to.
 */
export const CHAIR_SHOVE_TAG = 'shove';

/**
 * Where a shirt logo sits, and how the runtime finds it on any frame.
 *
 * The shirt back above the waist translates rigidly with the torso, so one
 * drawing works on every pose: the only thing that changes between frames is
 * how far down the body is. `torsoTop` is measured per frame at load, which
 * tracks that exactly and needs no table kept in step with the art.
 *
 * 14 wide because that is the clean run of shirt back on both poses, and 14
 * tall to sit centred in the 22 rows standing has spare.
 *
 * **Seated it is very nearly invisible.** The chair back covers 86% of the
 * shirt, leaving two rows at the shoulders. A logo is a standing feature, and
 * with the desk up about a third of the time that is roughly one visit in
 * three — absent on the others rather than wrong.
 */
const LOGO_LEFT = 13;
/** Rows below the first row of shirt, which puts it mid-back standing. */
const LOGO_TOP_OFFSET = 4;

/** The shirt fill as drawn, used to find the torso before any recolouring. */
const SHIRT_KEY: [number, number, number] = [223, 223, 223];

/**
 * The first row of shirt on each frame, or null where there is no shirt.
 *
 * Measured from the sheet as exported, before an outfit touches it: after the
 * recolour the shirt is whatever colour was chosen, and matching that would
 * move the anchor whenever somebody picked a shirt the same shade as something
 * else. `away` has no shirt at all, so a logo switches itself off when nobody
 * is there rather than needing to be told.
 */
const measureTorso = (
  image: HTMLImageElement | HTMLCanvasElement,
  frames: Frame[],
): (number | null)[] => {
  const canvas = scratch(image.width, image.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return frames.map(() => null);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0);
  const { data, width } = context.getImageData(0, 0, image.width, image.height);
  const [r, g, b] = SHIRT_KEY;

  return frames.map(({ rect }) => {
    for (let y = rect.y; y < rect.y + rect.h; y += 1) {
      for (let x = rect.x; x < rect.x + rect.w; x += 1) {
        const i = (y * width + x) * 4;
        if (data[i + 3] > 0 && data[i] === r && data[i + 1] === g && data[i + 2] === b) return y;
      }
    }
    return null;
  });
};

export type Assets = {
  /** Only used for its slices — the drawn room comes from `skies`. */
  room: Sheet;
  character: Sheet;
  /**
   * The chair, which used to be a layer inside `character.aseprite`.
   *
   * It is its own sprite because it moves independently of its occupant: they
   * stand, and it gets pushed out of the frame. One drawing, positioned by the
   * runtime, which is the same reason the desk left the room plate.
   *
   * Still drawn over the person, as the layer was, so the seat back covers
   * their lower half exactly as before.
   */
  chair: Sheet;
  /**
   * The desk, in the four pieces it has to be drawn in.
   *
   * It is no longer part of the room plate, because it moves. The order below
   * is the order they must be composited: the two sliding leg sections, then
   * the fixed sleeve that covers them, then the desktop and everything on it.
   */
  deskLegsInner: HTMLImageElement;
  deskLegsMid: HTMLImageElement;
  deskLegsFixed: HTMLImageElement;
  deskTop: HTMLImageElement;
  /** Call-state desktop: extended mic, with the hanging headphones hidden. */
  callDeskTop: HTMLImageElement;
  /** Extended mic alone, used to restore its pixels over live screen content. */
  callMic: HTMLImageElement;
  /** Character-registered overlay with one authored headset frame per pose. */
  headphones: Sheet;
  /** One tileable frame per condition, scrolled and clipped to the glass. */
  weather: Sheet;
  /**
   * White where sky is visible through the window, transparent everywhere else.
   * Derived rather than authored: clear-day and clear-night differ only where
   * the glass shows, so diffing them yields the exact region — including the
   * mullions, mic arm and desk edge that occlude it.
   */
  glass: HTMLCanvasElement;
  /** Full room renders keyed `<weather>-day` / `<weather>-night`. */
  skies: Record<string, HTMLImageElement>;
  /**
   * The CRT collapse, shared by every screen. Two tags, because the pair only
   * makes sense together: the last frame of `power-off` is the exact colour of
   * the dark plate in room.png, and `power-on` is that read backwards.
   */
  power: Sheet;
  /**
   * The screens that have been fetched, keyed by tag.
   *
   * A map rather than one sheet because each screen is now its own file. That
   * was forced rather than chosen: one sheet is a single row of frames, so its
   * width is the sum of everything on it, and at six screens it stood at
   * 12,374px against a limit usually quoted as 16,384. Two more would not have
   * fitted.
   *
   * Splitting them bought two things beyond the ceiling. Appending frames can
   * no longer extend a neighbouring tag, because there are no neighbours. And
   * only the screen actually playing is fetched, so adding a twelfth stops
   * taxing every visitor who is never going to see it.
   */
  screens: Map<string, Sheet>;
  digits: Sheet;
  switchPlate: Sheet;
  dark: HTMLImageElement;
  digitGlow: Glow | null;
  /** The current outfit's shirt logo, already inked. Null when it has none. */
  logo: HTMLCanvasElement | null;
  /** First row of shirt per character frame — see measureTorso. */
  torsoTop: (number | null)[];
  /**
   * Repaint the character for a different outfit, in place.
   *
   * The sheet draws from a canvas, so repainting that canvas is enough — no
   * sheet is rebuilt and nothing that holds a reference has to hear about it.
   * Always applied to the untouched image rather than to the last result, or
   * two outfits in a row would compound into a third.
   *
   * Here for the dev customiser. The page itself picks an outfit once and never
   * changes it, so in the shipped build this is called exactly zero times.
   */
  dressCharacter(outfit: Outfit): void;
};

/** Where a screen's own sheet lives. One file per tag, named after it. */
export const screenPath = (basePath: string, tag: string) => `${basePath}/screen-${tag}`;

/**
 * Fetch one screen, or null if it is not there.
 *
 * Null rather than a throw, for the same reason the draw falls back: a screen
 * name is the one part of the art contract chosen at runtime, so a tag nobody
 * has drawn yet should cost the wrong picture rather than the page.
 */
export const loadScreen = async (basePath: string, tag: string): Promise<Sheet | null> => {
  try {
    return await loadSheet(screenPath(basePath, tag));
  } catch {
    return null;
  }
};

/**
 * Fetch a logo stencil, or null if it is not there.
 *
 * A missing logo costs a plain shirt rather than a broken page, for the same
 * reason a missing screen costs the wrong picture: this is a name an outfit
 * chose, and outfits are edited far more often than the art is.
 */
export const loadLogo = async (
  basePath: string,
  art: string,
): Promise<HTMLImageElement | null> => {
  try {
    return await loadImage(`${basePath}/logo-${art}.png`);
  } catch {
    return null;
  }
};

const resolveRecord = async <T extends Record<string, Promise<unknown>>>(
  pending: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> =>
  Object.fromEntries(
    await Promise.all(Object.entries(pending).map(async ([key, value]) => [key, await value])),
  ) as { [K in keyof T]: Awaited<T[K]> };

/**
 * `basePath` is where the exported PNG and JSON are served from. It is a
 * parameter rather than a constant because a host site almost certainly serves
 * them somewhere other than /art.
 *
 * `screens` is which screen sheets to fetch now. Usually that is only what will
 * actually be shown, so the cost of the twelfth screen falls on whoever is
 * looking at it. A host with a picker may pass its choices up front to make the
 * first interaction instant. Anything named later is fetched then; see
 * `loadScreen`.
 *
 * `outfit` repaints the character as it is decoded. Once, at load — the sheet
 * the runtime draws from is already the right colour, so nothing downstream
 * knows an outfit exists.
 */
export const loadAssets = async (
  basePath = '/art',
  screens: readonly string[] = [],
  outfit: Outfit = OUTFITS[0],
): Promise<Assets> => {
  // The character as exported, kept so a different outfit can be applied to it
  // later. Recolouring the recoloured copy would stack one outfit on the next.
  let characterSource: HTMLImageElement | null = null;
  let characterCanvas: HTMLCanvasElement | null = null;
  // The stencil as drawn, kept unlinked so a change of ink does not have to
  // refetch it — and so re-inking never compounds on the last colour.
  let logoSource: HTMLImageElement | null = null;
  let logoArt: string | null = null;
  // Deduplicated, and always with a fallback in it: the draw needs something to
  // reach for when it is handed a name that has not been drawn.
  const wanted = [...new Set([FALLBACK_SCREEN_TAG, ...screens])];
  const [core, skyEntries, screenEntries, initialLogo] = await Promise.all([
    resolveRecord({
      room: loadSheet(artPath(basePath, SHEET_ASSETS.room)),
      power: loadSheet(artPath(basePath, SHEET_ASSETS.power)),
      digits: loadSheet(artPath(basePath, SHEET_ASSETS.digits)),
      switchPlate: loadSheet(artPath(basePath, SHEET_ASSETS.switchPlate)),
      weather: loadSheet(artPath(basePath, SHEET_ASSETS.weather)),
      character: loadSheet(artPath(basePath, SHEET_ASSETS.character), (image) => {
        characterSource = image;
        characterCanvas = recolour(image, outfit);
        return characterCanvas;
      }),
      chair: loadSheet(artPath(basePath, SHEET_ASSETS.chair)),
      headphones: loadSheet(artPath(basePath, SHEET_ASSETS.headphones)),
      dark: loadImage(`${roomLayerPath(basePath, 'dark')}.png`),
      callMic: loadImage(`${roomLayerPath(basePath, 'callMic')}.png`),
      deskLegsInner: loadImage(`${roomVariantPath(basePath, 'deskLegsInner')}.png`),
      deskLegsMid: loadImage(`${roomVariantPath(basePath, 'deskLegsMid')}.png`),
      deskLegsFixed: loadImage(`${roomVariantPath(basePath, 'deskLegsFixed')}.png`),
      deskTop: loadImage(`${roomVariantPath(basePath, 'deskTop')}.png`),
      callDeskTop: loadImage(`${roomVariantPath(basePath, 'callDeskTop')}.png`),
    }),
    Promise.all(
      SKY_VARIANTS.map(async (sky) => [sky, await loadImage(`${skyPath(basePath, sky)}.png`)] as const),
    ),
    Promise.all(wanted.map(async (tag) => [tag, await loadScreen(basePath, tag)] as const)),
    outfit.shirt.logo ? loadLogo(basePath, outfit.shirt.logo.art) : Promise.resolve(null),
  ]);
  const {
    room,
    power,
    digits,
    switchPlate,
    weather,
    character,
    chair,
    headphones,
    dark,
    deskLegsInner,
    deskLegsMid,
    deskLegsFixed,
    deskTop,
    callDeskTop,
    callMic,
  } = core;
  logoSource = initialLogo;
  logoArt = outfit.shirt.logo?.art ?? null;
  const skies = Object.fromEntries(skyEntries);

  const assets: Assets = {
    room,
    character,
    chair,
    headphones,
    deskLegsInner,
    deskLegsMid,
    deskLegsFixed,
    deskTop,
    callDeskTop,
    callMic,
    weather,
    glass: buildGlassMask(skies['clear-day'], skies['clear-night']),
    skies,
    power,
    screens: new Map(
      screenEntries.filter((entry): entry is [string, Sheet] => entry[1] !== null),
    ),
    digits,
    switchPlate,
    dark,
    digitGlow: DIGIT_GLOW ? Glow.build(digits.image, digits.frames) : null,
    logo:
      logoSource && outfit.shirt.logo ? inkStencil(logoSource, outfit.shirt.logo.ink) : null,
    torsoTop: characterSource ? measureTorso(characterSource, character.frames) : [],
    dressCharacter(next) {
      if (characterSource && characterCanvas) recolour(characterSource, next, characterCanvas);

      const wantedLogo = next.shirt.logo;
      if (!wantedLogo) {
        assets.logo = null;
        return;
      }
      // Same drawing, different colour: re-ink what is already here. A
      // different drawing has to be fetched, and lands when it lands — the
      // shirt simply has no logo until then, which beats printing the old one
      // in the new colour.
      if (wantedLogo.art === logoArt && logoSource) {
        assets.logo = inkStencil(logoSource, wantedLogo.ink);
        return;
      }
      assets.logo = null;
      loadLogo(basePath, wantedLogo.art).then((image) => {
        if (!image) return;
        logoSource = image;
        logoArt = wantedLogo.art;
        assets.logo = inkStencil(image, wantedLogo.ink);
      });
    },
  };

  return assets;
};

/** Offscreen scratch for clipping the sky to the glass. Reused every frame. */
let skyBuffer: HTMLCanvasElement | null = null;
/** Offscreen scratch for dimming the character. Reused every frame. */
let characterBuffer: HTMLCanvasElement | null = null;
/** Offscreen scratch for dimming the mic pixels redrawn over the live screen. */
let callMicBuffer: HTMLCanvasElement | null = null;

/**
 * Alpha of room.dark.png. The wash multiplies it, so dimming anything drawn
 * after the wash by the same amount means matching this.
 */
const MASK_ALPHA = 152 / 255;

const scratch = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

/**
 * Restore only the call mic pixels crossed by the live monitor content.
 *
 * The authored desk variant already composites the mic correctly over the
 * bezel and every other desk layer. The animated screen is painted later,
 * however, so it covers the part of the boom inside the screen slice. Redraw
 * that intersection only; drawing the whole mic again here would brighten its
 * remaining pixels after the room wash and could incorrectly cover the clock.
 */
const drawCallMicOverScreen = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  screen: { x: number; y: number; w: number; h: number },
  deskRise: number,
  wash: number,
) => {
  if (!callMicBuffer) callMicBuffer = scratch(SCENE_WIDTH, SCENE_HEIGHT);
  const buffer = callMicBuffer.getContext('2d');
  if (!buffer) return;

  buffer.imageSmoothingEnabled = false;
  buffer.globalCompositeOperation = 'source-over';
  buffer.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  buffer.save();
  buffer.beginPath();
  buffer.rect(screen.x, screen.y - deskRise, screen.w, screen.h);
  buffer.clip();
  buffer.drawImage(image, 0, -deskRise);
  buffer.restore();

  if (wash > 0.001) {
    buffer.globalCompositeOperation = 'source-atop';
    buffer.fillStyle = `rgba(0, 0, 0, ${MASK_ALPHA * wash})`;
    buffer.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    buffer.globalCompositeOperation = 'source-over';
  }

  context.drawImage(callMicBuffer, 0, 0);
};

const buildGlassMask = (day: HTMLImageElement, night: HTMLImageElement): HTMLCanvasElement => {
  const read = (image: HTMLImageElement) => {
    const canvas = scratch(SCENE_WIDTH, SCENE_HEIGHT);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('buildGlassMask could not get a 2d context');
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  };

  const a = read(day);
  const b = read(night);

  const mask = scratch(SCENE_WIDTH, SCENE_HEIGHT);
  const context = mask.getContext('2d');
  if (!context) throw new Error('buildGlassMask could not get a 2d context');
  const out = context.createImageData(SCENE_WIDTH, SCENE_HEIGHT);

  for (let i = 0; i < a.data.length; i += 4) {
    const differs =
      a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2];
    if (differs) {
      out.data[i] = 255;
      out.data[i + 1] = 255;
      out.data[i + 2] = 255;
      out.data[i + 3] = 255;
    }
  }
  context.putImageData(out, 0, 0);
  return mask;
};

/**
 * Draw the sky, scrolled and clipped so it only appears through the window.
 *
 * Canvas clip() takes a path, not an image, so the clipping is done on an
 * offscreen buffer with destination-in against the glass mask.
 */
const drawSky = (
  context: CanvasRenderingContext2D,
  assets: Assets,
  weather: Weather,
  elapsed: number,
  nightAmount: number,
) => {
  const motion = SKY_MOTION[weather];
  if (motion.alpha <= 0.01) return;

  if (!skyBuffer) skyBuffer = scratch(SCENE_WIDTH, SCENE_HEIGHT);
  const buffer = skyBuffer.getContext('2d');
  if (!buffer) return;

  buffer.imageSmoothingEnabled = false;
  buffer.globalCompositeOperation = 'source-over';
  buffer.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);

  const seconds = elapsed / 1000;
  const wrap = (value: number, size: number) => ((value % size) + size) % size;
  const day = Math.max(0, WEATHER_CONDITIONS.indexOf(weather));
  const night = day + NIGHT_FRAME_OFFSET;

  for (const pass of motion.passes) {
    // Crossfade the pair, skipping whichever end is not showing. Outside dawn
    // and dusk that is one of them, so the common case costs no extra drawing.
    for (const [frame, share, drift] of [
      [day, 1 - nightAmount, motion.day],
      [night, nightAmount, motion.night],
    ] as const) {
      if (share <= 0.01) continue;

      const offsetX = wrap(Math.round(drift.x * pass.speed * seconds) + pass.shift[0], SCENE_WIDTH);
      const offsetY = wrap(
        Math.round(drift.y * pass.speed * seconds) + pass.shift[1],
        SCENE_HEIGHT,
      );

      buffer.globalAlpha = pass.alpha * share;
      // Four placements cover the canvas whatever the offset, so the tile wraps.
      for (const dx of [offsetX - SCENE_WIDTH, offsetX]) {
        for (const dy of [offsetY - SCENE_HEIGHT, offsetY]) {
          assets.weather.draw(buffer, frame, dx, dy);
        }
      }
    }
  }
  buffer.globalAlpha = 1;

  buffer.globalCompositeOperation = 'destination-in';
  buffer.drawImage(assets.glass, 0, 0);
  buffer.globalCompositeOperation = 'source-over';

  const previous = context.globalAlpha;
  context.globalAlpha = motion.alpha;
  context.drawImage(skyBuffer, 0, 0);
  context.globalAlpha = previous;
};

/**
 * Where the monitor is in its power cycle. Power only.
 *
 * It used to carry the content as well — `'on' | 'game' | 'idle' | 'off'` plus
 * the two transitions — which made a third scene a change to a union type, a
 * lookup table and two boolean expressions that had to list every lit state by
 * name. What is playing is a tag, and tags belong in a list.
 */
export type MonitorPhase = 'lit' | 'off' | 'turning-on' | 'turning-off';

/**
 * The tag each power phase plays, or null for the phases that draw nothing.
 *
 * `lit` is null because it does not know: the content is whatever the caller
 * hands over in `screenTag`.
 */
export const MONITOR_TAG: Record<MonitorPhase, string | null> = {
  lit: null,
  off: null,
  'turning-on': 'power-on',
  'turning-off': 'power-off',
};

export type SceneState = {
  /** Milliseconds into the monitor animation. */
  elapsed: number;
  now: Date;
  /** Zone the room keeps. Omitted, the scene runs on the viewer's own clock. */
  timeZone?: string;
  /**
   * How far the desk has risen, 0 to DESK_TRAVEL. Eased by the caller, so this
   * is a real number mid-journey rather than one of two settled heights.
   */
  deskOffset?: number;
  /** 0 plugged in, 1 lying on the floor. Eased by the caller, so the plug falls. */
  cableFall?: number;
  /**
   * How far right the chair has been pushed, in scene pixels from its seat.
   *
   * Pixels rather than 0-to-1 because the distance is a property of the room —
   * how far it is from the seat to out of shot — and the scene is the only
   * thing that knows the room's width. CHAIR_EXIT is that distance.
   */
  chairShift?: number;
  /**
   * Whether the desk has mains power.
   *
   * Separate from the monitor's phase, which lags behind it while the screen
   * collapses. Anything else the desk feeds — the clock, the indicator on the
   * power box — goes the instant the plug does.
   */
  powered?: boolean;
  /**
   * A one-shot to play instead of what `presence` implies, with its own clock.
   *
   * Presence is a lookup: a state with no time in it. A reaction is a moment
   * timed from when it started, so the caller names the tag and says how far in
   * we are, rather than a presence value being invented for every frame of
   * every reaction.
   */
  characterOneShot?: { tag: string; elapsed: number };
  /** As above, for the chair: its shove-off reaction has its own clock. */
  chairOneShot?: { tag: string; elapsed: number };
  /** In the chair or on their feet. Defaults to seated. */
  posture?: Posture;
  /**
   * What plays while the monitor is lit — a scene or a screensaver, whichever
   * the caller decided.
   *
   * One field for both, because the monitor does not care which it is. Choosing
   * is host policy: it depends on whether anyone is at the desk, and the scene
   * has no opinion about that. Falls back to the first scene if the tag has not
   * been drawn.
   */
  screenTag?: string;
  /** Freezes the monitor loop and holds the colon lit. */
  reducedMotion: boolean;
  /** Already-resolved mask opacity — see washFor. */
  wash: number;
  lightsOn: boolean;
  hour24: boolean;
  weather: Weather;
  presence: ToggleValues['presence'];
  /**
   * Where the monitor is in its power cycle, and how far into that phase.
   * Resolved by the caller because the transitions are one-shots that have to
   * be timed from the moment of the toggle, not from the scene clock.
   */
  monitor: { phase: MonitorPhase; elapsed: number };
  /** 0 = day windows, 1 = night windows. Eased, so it crossfades. */
  nightAmount: number;
};

/** Colon blinks once a second, lit for the first half. */
const colonFrame = (date: Date, steady: boolean) =>
  steady || date.getMilliseconds() < 500 ? COLON_LIT_FRAME : COLON_DIM_FRAME;

/**
 * Glyph frames for HH:MM in either format.
 *
 * 12-hour blanks the leading zero, but the cell is still there on the panel, so
 * it shows unlit segments rather than nothing. 24-hour always fills all four
 * digits, so it simply never reaches the blank frame — same sheet either way.
 */
export const clockGlyphs = (
  date: Date,
  steadyColon: boolean,
  hour24: boolean,
  timeZone?: string,
): number[] => {
  const at = zonedParts(date, timeZone);
  const raw = at.hour;
  const hours = hour24 ? raw : raw % 12 === 0 ? 12 : raw % 12;
  const minutes = at.minute;
  const leading = Math.floor(hours / 10);
  return [
    hour24 || hours >= 10 ? leading : DIGIT_BLANK_FRAME,
    hours % 10,
    colonFrame(date, steadyColon),
    Math.floor(minutes / 10),
    minutes % 10,
  ];
};

/**
 * The chair and its occupant, drawn over everything else.
 *
 * They sit between the camera and the desk, so they cover the desk lip and the
 * lower part of the monitor — which means drawing after the screens, and so
 * after the wash. Being a wall object rather than an emissive one they still
 * have to dim at night, so the wash is applied to them individually on a buffer
 * rather than being skipped.
 */
const drawCharacter = (
  context: CanvasRenderingContext2D,
  assets: Assets,
  state: Pick<
    SceneState,
    | 'presence'
    | 'posture'
    | 'reducedMotion'
    | 'characterOneShot'
    | 'chairOneShot'
  > & { elapsed: number; wash: number; chairShift: number; headphonesOn: boolean },
) => {
  const { room, character, chair, headphones, logo, torsoTop } = assets;
  const at = room.slice('character');
  const {
    presence,
    posture = 'seated',
    elapsed,
    reducedMotion,
    wash,
    chairShift,
    headphonesOn,
    characterOneShot: oneShot,
    chairOneShot,
  } = state;

  const { tag, once } = characterTag(
    (name) => character.hasTag(name),
    presence,
    posture,
    oneShot?.tag,
  );
  // A reaction runs on its own clock, so it starts at the tag's first frame
  // rather than wherever the scene clock happens to be.
  const clock = reducedMotion ? 0 : once ? (oneShot?.elapsed ?? 0) : elapsed;
  // A reaction plays once and holds its last frame; presence loops.
  const frame = !tag
    ? character.frameAt(clock)
    : once
      ? character.frameOnce(clock, tag)
      : character.frameAt(clock, tag);

  // Whole pixels. The chair travels on an eased float, and drawing it at a
  // fraction makes the canvas resample a sprite whose whole point is that it is
  // not resampled.
  const chairX = at.x + Math.round(chairShift);
  // The chair is one drawing until it has poses of its own, so a missing tag
  // is the normal case here rather than a half-finished one.
  const chairFrame =
    chairOneShot && chair.hasTag(chairOneShot.tag)
      ? chair.frameOnce(reducedMotion ? 0 : chairOneShot.elapsed, chairOneShot.tag)
      : 0;

  // Where the shirt starts on this frame, which is what the logo hangs off.
  // Null on a frame with no shirt, so `away` needs no special case.
  const shirtTop = torsoTop[frame] ?? null;

  // Person, then logo, then chair. The logo goes inside this pass rather than
  // after it for two reasons: it has to dim with the room like the rest of the
  // shirt, and the chair has to be able to cover it — which seated it almost
  // entirely does.
  const paint = (target: CanvasRenderingContext2D) => {
    character.draw(target, frame, at.x, at.y);
    if (headphonesOn) headphones.draw(target, frame, at.x, at.y);
    if (logo && shirtTop !== null) {
      // Both are rows and columns within the frame, so they need the slice's
      // own origin added to land in scene space.
      target.drawImage(logo, at.x + LOGO_LEFT, at.y + shirtTop + LOGO_TOP_OFFSET);
    }
    chair.draw(target, chairFrame, chairX, at.y);
  };

  if (wash <= 0.001) {
    paint(context);
    return;
  }

  if (!characterBuffer) characterBuffer = scratch(SCENE_WIDTH, SCENE_HEIGHT);
  const buffer = characterBuffer.getContext('2d');
  if (!buffer) return;

  buffer.imageSmoothingEnabled = false;
  buffer.globalCompositeOperation = 'source-over';
  buffer.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  // One buffer for both, so the wash is applied to the pair rather than twice
  // over the region where the seat back overlaps the body.
  paint(buffer);

  // source-atop keeps the dimming inside the drawn pixels, so the transparent
  // rest of the buffer stays transparent.
  buffer.globalCompositeOperation = 'source-atop';
  buffer.fillStyle = `rgba(0, 0, 0, ${MASK_ALPHA * wash})`;
  buffer.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  buffer.globalCompositeOperation = 'source-over';

  context.drawImage(characterBuffer, 0, 0);
};

/**
 * The cable, stepped onto whole pixels.
 *
 * Drawn before the legs so the near one covers where the run ends.
 *
 * Stepped by hand rather than stroked, because a stroked path is antialiased
 * and would put grey fringes on the one line in the scene that has to look
 * drawn.
 */
const drawCable = (context: CanvasRenderingContext2D, fall: number) => {
  const from = {
    x: CABLE_FROM.x + (CABLE_FALLEN.x - CABLE_FROM.x) * fall,
    y: CABLE_FROM.y + (CABLE_FALLEN.y - CABLE_FROM.y) * fall,
  };

  const points: [number, number][] = [];
  const push = (x: number, y: number) => {
    const px = Math.round(x);
    const py = Math.round(y);
    const last = points[points.length - 1];
    if (!last || last[0] !== px || last[1] !== py) points.push([px, py]);
  };

  // Down from the plug onto the floor.
  for (let i = 0; i <= 40; i += 1) {
    const t = i / 40;
    const u = 1 - t;
    push(
      u * u * from.x + 2 * u * t * 14 + t * t * 18,
      u * u * from.y + 2 * u * t * CABLE_FLOOR + t * t * CABLE_FLOOR,
    );
  }

  // Flat along the floor to the leg. It stays on the ground the whole way: a
  // wave here lifted it back off the floor mid-run, which reads as a cable
  // caught on something rather than one lying where it fell.
  for (let x = 18; x <= CABLE_END; x += 1) push(x, CABLE_FLOOR);

  context.fillStyle = CABLE_COLOUR;

  /**
   * The plug: a stub at the free end. Without it the cable merely starts lower
   * when unplugged, far too quiet a signal for something that has just killed
   * the monitor.
   */
  context.fillRect(Math.round(from.x), Math.round(from.y) - 1, 2, 3);

  for (const [x, y] of points) context.fillRect(x, y, 1, 1);
};

export const drawScene = (context: CanvasRenderingContext2D, assets: Assets, state: SceneState) => {
  // The character is not pulled out here: it is drawn last by drawCharacter.
  const { room, skies, power, screens, digits, switchPlate, dark, digitGlow } = assets;
  const { deskLegsInner, deskLegsMid, deskLegsFixed, deskTop, callDeskTop, callMic } = assets;
  const {
    elapsed,
    now,
    reducedMotion,
    wash,
    lightsOn,
    hour24,
    monitor,
    nightAmount,
    weather,
    presence,
    timeZone,
    screenTag = FALLBACK_SCREEN_TAG,
    deskOffset = 0,
    cableFall = 0,
    chairShift = 0,
    posture = 'seated',
    powered = true,
    characterOneShot,
    chairOneShot,
  } = state;
  const effects = effectsForScreen(screenTag);

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);

  // The room itself comes from the weather variant, so room.png is never drawn
  // — it exists to carry the slices. Day and night are full flattened renders
  // differing only at the glass, so crossfading them changes the sky without
  // touching anything drawn in front of the window.
  context.drawImage(skies[`${weather}-day`], 0, 0);
  if (nightAmount > 0.001) {
    const previous = context.globalAlpha;
    context.globalAlpha = nightAmount;
    context.drawImage(skies[`${weather}-night`], 0, 0);
    context.globalAlpha = previous;
  }

  // Moving sky goes straight on top of the static one, still behind everything
  // in the room, and clipped so it never reaches the mic arm or the desk.
  drawSky(context, assets, weather, elapsed, nightAmount);

  /**
   * The desk, on top of the sky so it occludes the window.
   *
   * That occlusion used to come from flattening the desk into the room plate,
   * which is exactly what stopped it moving: the glass mask is derived by
   * diffing the day and night plates, so a desk baked into both was invisible
   * to the mask and could never be anywhere else. Drawn here instead, the mask
   * describes the whole window and the desk covers whatever part of it the desk
   * happens to be in front of.
   *
   * Order matters and is not adjustable: the sliding sections first, then the
   * fixed sleeve that hides where they emerge, then the desktop over both.
   */
  //
  // Rounded per piece rather than once: at a fractional offset the post and the
  // desktop must land on the same row or a seam opens between them.
  const deskRise = Math.round(deskOffset);
  const midRise = Math.round(deskOffset * LEGS_MID_SHARE);

  // The cable runs against the wall, so it goes behind the legs. Drawn after
  // them it visibly cut across the near leg on its way to the desk.
  drawCable(context, cableFall);

  context.drawImage(deskLegsInner, 0, -deskRise);
  context.drawImage(deskLegsMid, 0, -midRise);
  context.drawImage(deskLegsFixed, 0, 0);
  context.drawImage(effects.desk === 'call' ? callDeskTop : deskTop, 0, -deskRise);

  // The switch is a wall object, so it belongs under the wash and dims with
  // everything else. Only the screens are emissive.
  const switchAt = room.slice('light-switch');
  switchPlate.draw(context, lightsOn ? SWITCH_ON_FRAME : SWITCH_OFF_FRAME, switchAt.x, switchAt.y);

  if (wash > 0.001) {
    const previous = context.globalAlpha;
    context.globalAlpha = wash;
    context.drawImage(dark, 0, 0);
    context.globalAlpha = previous;
  }

  // Everything below is self-lit and is drawn over the wash, so the monitor and
  // clock keep glowing while the room goes dark. In Aseprite the LIGHTING group
  // sits on top and dims these too, which is right for a still and wrong here.
  //
  // A monitor that is off needs no art: room.png already has a flat dark plate
  // at this slice, so drawing nothing reveals a blank screen. The power frames
  // end on that same colour, so the hand-off does not pop.
  //
  // Rides the desk, so the content has to move with the bezel around it.
  const screenAt = room.slice('monitor-screen');
  if (monitor.phase === 'lit') {
    // A screen is a whole file now, so there is no tag to ask for — the sheet
    // is the screen and it plays end to end. Falling back rather than throwing:
    // a screen name is the one piece of the art contract a host picks at
    // runtime, so one that has not been drawn should cost the wrong picture
    // rather than the page. It can also simply not have arrived yet.
    const sheet = screens.get(screenTag) ?? screens.get(FALLBACK_SCREEN_TAG);
    if (sheet) sheet.draw(context, sheet.frameAt(elapsed), screenAt.x, screenAt.y - deskRise);
  } else {
    // The transitions are one-shots timed from the toggle and held on their
    // last frame, and they share one sheet, so these are still tags.
    const tag = MONITOR_TAG[monitor.phase];
    if (tag) {
      power.draw(context, power.frameOnce(monitor.elapsed, tag), screenAt.x, screenAt.y - deskRise);
    }
  }

  if (effects.screenOverlay === 'call-mic') {
    drawCallMicOverScreen(context, callMic, screenAt, deskRise, wash);
  }

  // Rides the desk too.
  const clock = room.slice('clock-screen');
  /**
   * With no power the clock shows its ghost: every segment unlit, which is what
   * an LCD looks like dead rather than a blank hole. The sprite already carries
   * those frames — 12 for a digit with nothing lit, 11 for the dim colon — for
   * the blanked leading digit, so nothing new was needed.
   */
  const glyphs = powered
    ? clockGlyphs(now, reducedMotion, hour24, timeZone)
    : [DIGIT_BLANK_FRAME, DIGIT_BLANK_FRAME, COLON_DIM_FRAME, DIGIT_BLANK_FRAME, DIGIT_BLANK_FRAME];

  const placed = glyphs.map((glyph, index) => ({
    glyph,
    x: clock.x + CLOCK_PADDING_X + index * GLYPH_ADVANCE,
    y: clock.y + CLOCK_PADDING_Y - deskRise,
  }));

  if (digitGlow) placed.forEach(({ glyph, x, y }) => digitGlow.draw(context, glyph, x, y));
  placed.forEach(({ glyph, x, y }) => digits.draw(context, glyph, x, y));

  // After the wash, with the monitor and the clock: a lit lamp keeps its
  // brightness in a dark room. It rides the desk, so it takes the same offset.
  if (powered) {
    context.fillStyle = POWER_LED_COLOUR;
    context.fillRect(POWER_LED.x, POWER_LED.y - deskRise, 1, 1);
  }

  // The camera light is part of the call state, not merely mains power. It is
  // emissive like the power-box LED and only lit while the monitor is actually
  // showing the call.
  if (powered && monitor.phase === 'lit' && effects.cameraIndicator) {
    context.fillStyle = POWER_LED_COLOUR;
    context.fillRect(CAMERA_LED.x, CAMERA_LED.y - deskRise, 1, 1);
  }

  drawCharacter(context, assets, {
    presence,
    posture,
    elapsed,
    reducedMotion,
    wash,
    chairShift,
    headphonesOn: effects.characterOverlay === 'headphones',
    characterOneShot,
    chairOneShot,
  });
};
