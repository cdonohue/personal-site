import { Rect } from './aseprite';
import {
  Assets,
  MonitorPhase,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  drawScene,
  loadAssets,
  nightAmountFor,
  washFor,
} from './render';
import { DEFAULT_VALUES, ToggleValues } from './toggles';

/**
 * A mounted desk-room scene, independent of any framework.
 *
 * The split is deliberate: everything that is *scene behaviour* lives here —
 * loading, the animation loop, easing the wash, and the monitor's power state
 * machine. Everything that is *host behaviour* stays out — how big the canvas
 * is on the page, whether values persist, and what controls the user gets.
 * A host site will want its own answers to those and the same answers to these.
 */
export type DeskRoom = {
  /** Fixed pixel dimensions of the scene, before any CSS scaling. */
  readonly width: number;
  readonly height: number;
  /** Merge new values in. Anything omitted keeps its current setting. */
  set(values: Partial<ToggleValues>): void;
  get(): Readonly<ToggleValues>;
  /**
   * Bounds of a named slice, in scene pixels. Hosts need these to place their
   * own hit targets over the switch, clock and monitor.
   */
  slice(name: string): Rect | undefined;
  start(): void;
  stop(): void;
};

export type DeskRoomOptions = {
  /** Where the exported PNG and JSON are served from. Default '/art'. */
  basePath?: string;
  /** Initial values, merged over the defaults. */
  values?: Partial<ToggleValues>;
  /**
   * Freeze animation. Defaults to the visitor's prefers-reduced-motion, so a
   * host gets that for free but can override it.
   */
  reducedMotion?: boolean;
  /**
   * IANA zone the room keeps its hours in — the clock face, the day/night
   * curve, everything the scene derives from time.
   *
   * Left out, the room runs on the viewer's clock, which is the right default
   * for a scene that could be anyone's. Set, the room keeps somebody's actual
   * hours and a visitor is looking in on them rather than at a mirror. Must be
   * a zone name, never an offset, or it drifts an hour twice a year.
   */
  timeZone?: string;
};

/** How quickly the wash and the night level chase their targets. */
const EASING = 0.18;

export const createDeskRoom = async (
  canvas: HTMLCanvasElement,
  options: DeskRoomOptions = {},
): Promise<DeskRoom> => {
  const assets: Assets = await loadAssets(options.basePath);

  const reducedMotion =
    options.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  canvas.width = SCENE_WIDTH;
  canvas.height = SCENE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('createDeskRoom: could not get a 2d context');

  let values: ToggleValues = { ...DEFAULT_VALUES, ...options.values };

  // Eased, so a manual switch fades rather than cutting. In auto the target
  // moves on its own and the clock's drift is already gradual.
  const timeZone = options.timeZone;

  let night = nightAmountFor(values.lighting, new Date(), timeZone);
  let wash = washFor(values.roomLight === 'on', night);

  const litPhase = (): MonitorPhase =>
    values.monitor === 'off' ? 'on' : (values.monitor as MonitorPhase);
  const monitor = {
    phase: values.monitor === 'off' ? ('off' as MonitorPhase) : litPhase(),
    since: 0,
  };

  let handle = 0;
  let startedAt = 0;

  const step = (time: number) => {
    const now = new Date();

    const nightTarget = nightAmountFor(values.lighting, now, timeZone);
    night = reducedMotion ? nightTarget : night + (nightTarget - night) * EASING;
    const washTarget = washFor(values.roomLight === 'on', night);
    wash = reducedMotion ? washTarget : wash + (washTarget - wash) * EASING;

    // idle and game are powered states too — they only swap content, so
    // switching between them must not replay the power transition.
    const wantOn = values.monitor !== 'off';
    if (wantOn && (monitor.phase === 'off' || monitor.phase === 'turning-off')) {
      monitor.phase = 'turning-on';
      monitor.since = time;
    } else if (!wantOn && monitor.phase !== 'off' && monitor.phase !== 'turning-off') {
      // Covers turning-on as well, so a fast double-toggle reverses rather
      // than sticking mid-transition.
      monitor.phase = 'turning-off';
      monitor.since = time;
    } else if (monitor.phase === 'on' || monitor.phase === 'game' || monitor.phase === 'idle') {
      monitor.phase = litPhase();
    }

    const inPhase = time - monitor.since;
    if (reducedMotion) {
      monitor.phase = wantOn ? litPhase() : 'off';
    } else if (monitor.phase === 'turning-on' && inPhase >= assets.screen.tagDuration('power-on')) {
      monitor.phase = litPhase();
    } else if (
      monitor.phase === 'turning-off' &&
      inPhase >= assets.screen.tagDuration('power-off')
    ) {
      monitor.phase = 'off';
    }

    drawScene(context, assets, {
      elapsed: reducedMotion ? 0 : time - startedAt,
      now,
      timeZone,
      reducedMotion,
      wash,
      lightsOn: values.roomLight === 'on',
      hour24: values.clock === '24-hour',
      monitor: { phase: monitor.phase, elapsed: inPhase },
      nightAmount: night,
      weather: values.weather,
      presence: values.presence,
    });

    handle = window.requestAnimationFrame(step);
  };

  return {
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    set(next) {
      values = { ...values, ...next };
    },
    get() {
      return values;
    },
    slice(name) {
      return assets.room.slices.get(name);
    },
    start() {
      if (handle) return;
      startedAt = performance.now();
      handle = window.requestAnimationFrame(step);
    },
    stop() {
      if (!handle) return;
      window.cancelAnimationFrame(handle);
      handle = 0;
    },
  };
};
