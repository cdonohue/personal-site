import type { Rect } from './aseprite';
import {
  DESK_MAX,
  DESK_RAISED,
  SCREENSAVER_TAGS,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  drawScene,
  loadAssets,
  nightAmountFor,
  washFor,
} from './render';
import type { Assets, MonitorPhase } from './render';
import { DEFAULT_VALUES, type ToggleValues } from './toggles';

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
   *
   * Slices are static, but some of them ride the desk. `deskOffset` says how
   * far that is right now, so a host can shift a hit target to match rather
   * than leaving the button behind when the desk goes up.
   */
  slice(name: string): Rect | undefined;
  /** How far the desk has currently risen, in scene pixels. */
  deskOffset(): number;
  /** Raise or lower the desk. It travels rather than jumping. */
  toggleDesk(): void;
  /**
   * Pull the plug out of the wall, or push it back in.
   *
   * Cuts the monitor's power while it is out, whatever the schedule wants, and
   * the monitor plays its own power-off as it goes — the desk is fed from that
   * outlet, so this is the mains going rather than a setting changing.
   */
  toggleCable(): void;
  /** True while the plug is out. */
  cableUnplugged(): boolean;
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

/**
 * The desk's spring, tuned against the pixel grid rather than by feel.
 *
 * Slack on purpose. A stiffer spring reached full height in 0.15s, which is
 * snappy-toggle timing and reads as a panel sliding rather than as furniture
 * being driven up. This takes 0.32s to the top and about a second to stop
 * moving, which is still far quicker than a real desk but heavy enough to
 * suggest one.
 *
 * Lowering both constants together does not achieve this: stiffness drives the
 * rise and damping only governs the tail, so slackening both stretches the
 * settle while leaving the climb just as abrupt. Stiffness had to come down
 * five-fold and damping only half.
 *
 * Damping governs the bounce and barely touches the climb, which is why it is
 * the knob for this: 0.12 overshot by 3px and rocked back through two rows,
 * which was more than furniture should do. At 0.15 it lifts 2px past its rest
 * and settles straight down through one row.
 *
 * Tuned together with DESK_RAISED so the arc finishes without touching the
 * ceiling: from a rest of 14 it peaks at 15.76 against an 18px limit, so the
 * clamp fires on no frames at all.
 */
/** The plug drops rather than travels, so this is far brisker than the desk. */
const CABLE_FALL_EASING = 0.22;

const DESK_STIFFNESS = 0.02;

/**
 * Damping differs by direction, because the two journeys are not the same
 * event.
 *
 * Going up, the desk is driven to a height and settles there, so a little
 * overshoot reads as a motor arriving: 2px past its rest and back through one
 * row.
 *
 * Coming down it is returning to its stop, and there is nothing below to bounce
 * off. Shared damping made it accelerate the whole way, undershoot to -0.45 and
 * sit clamped against the floor for fifteen frames — it hit the bottom flat.
 * Critical damping for this stiffness is 2 * sqrt(0.02), about 0.28 — the point
 * where overshoot disappears. This sits just past it, overdamped on purpose, so
 * the arrival is unmistakably slow rather than merely not-bouncing: the last
 * pixel takes thirteen frames where the first took one.
 */
const DESK_DAMPING_UP = 0.15;
const DESK_DAMPING_DOWN = 0.31;

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

  /**
   * Which screensaver this visit gets, chosen once at mount.
   *
   * Per visit rather than per idle: switching while the viewer is watching would
   * look like a glitch, and a screensaver that varies between visits is what a
   * real one does. Anything the sheet does not have is dropped, so a half-drawn
   * tag cannot leave the screen blank.
   */
  const available = SCREENSAVER_TAGS.filter((tag) => assets.screen.hasTag(tag));
  const screensaverTag =
    available[Math.floor(Math.random() * available.length)] ?? SCREENSAVER_TAGS[0];

  let night = nightAmountFor(values.lighting, new Date(), timeZone);
  let wash = washFor(values.roomLight === 'on', night);

  const litPhase = (): MonitorPhase =>
    values.monitor === 'off' ? 'on' : (values.monitor as MonitorPhase);
  const monitor = {
    phase: values.monitor === 'off' ? ('off' as MonitorPhase) : litPhase(),
    since: 0,
  };

  /**
   * The desk is sprung rather than eased.
   *
   * Everything else here chases its target exponentially, which decelerates
   * smoothly and never arrives from the far side. A desk that overshoots and
   * settles reads as something with mass being driven into place, which is most
   * of the point of a sit/stand desk.
   *
   * Position and velocity, integrated per frame, clamped to what the leg can
   * physically do. Reduced motion skips to the resting height.
   */
  let deskRaised = false;
  let desk = 0;
  let deskVelocity = 0;

  /**
   * The plug. Eased so it drops rather than teleporting, and quickly — it is
   * falling, not travelling.
   */
  let cablePlugged = true;
  let cableFall = 0;

  let handle = 0;
  let startedAt = 0;

  const step = (time: number) => {
    const now = new Date();

    const nightTarget = nightAmountFor(values.lighting, now, timeZone);
    night = reducedMotion ? nightTarget : night + (nightTarget - night) * EASING;
    const washTarget = washFor(values.roomLight === 'on', night);
    wash = reducedMotion ? washTarget : wash + (washTarget - wash) * EASING;

    const fallTarget = cablePlugged ? 0 : 1;
    cableFall = reducedMotion ? fallTarget : cableFall + (fallTarget - cableFall) * CABLE_FALL_EASING;
    if (Math.abs(fallTarget - cableFall) < 0.01) cableFall = fallTarget;

    const deskTarget = deskRaised ? DESK_RAISED : 0;
    if (reducedMotion) {
      desk = deskTarget;
      deskVelocity = 0;
    } else {
      const damping = deskRaised ? DESK_DAMPING_UP : DESK_DAMPING_DOWN;
      deskVelocity += (deskTarget - desk) * DESK_STIFFNESS - deskVelocity * damping;
      desk = Math.max(0, Math.min(DESK_MAX, desk + deskVelocity));
      // A spring never quite arrives, so it has to be told when it is close
      // enough. Both terms matter: position alone would snap it mid-bounce, on
      // the frame it passes through its own target at speed.
      if (Math.abs(deskTarget - desk) < 0.05 && Math.abs(deskVelocity) < 0.05) {
        desk = deskTarget;
        deskVelocity = 0;
      }
    }

    // idle and game are powered states too — they only swap content, so
    // switching between them must not replay the power transition.
    //
    // An unplugged cable beats the schedule outright: the desk is fed from that
    // outlet, so there is no power to be on with.
    const wantOn = values.monitor !== 'off' && cablePlugged;
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
      screensaverTag,
      reducedMotion,
      wash,
      lightsOn: values.roomLight === 'on',
      hour24: values.clock === '24-hour',
      monitor: { phase: monitor.phase, elapsed: inPhase },
      nightAmount: night,
      weather: values.weather,
      presence: values.presence,
      deskOffset: desk,
      cableFall,
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
    deskOffset() {
      return desk;
    },
    toggleDesk() {
      deskRaised = !deskRaised;
    },
    toggleCable() {
      cablePlugged = !cablePlugged;
    },
    cableUnplugged() {
      return !cablePlugged;
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
