import type { Rect } from './aseprite';
import {
  CHAIR_EXIT,
  CHAIR_SHOVE_TAG,
  DESK_MAX,
  DESK_RAISED,
  POSTURE_TAG,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  STARTLE_TAG,
  drawScene,
  loadAssets,
  loadScreen,
  nightAmountFor,
  washFor,
} from './render';
import type { Assets, MonitorPhase, Posture } from './render';
import type { Outfit } from './outfits';
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
   * What the figure is wearing. Defaults to the drawing as exported.
   *
   * Applied while the sheet is decoded rather than per frame, so it costs one
   * pass over 79,000 pixels at load and nothing at all thereafter.
   */
  outfit?: Outfit;
  /**
   * How the desk is found on arrival. Defaults to seated.
   *
   * Settled rather than played: the scene opens on a room that is already one
   * way or the other. Animating into it would mean the page loads and then
   * immediately performs a stand nobody asked for, and in an empty room there
   * is no one to perform it.
   */
  posture?: Posture;
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

/**
 * The pause between the power going and the person noticing.
 *
 * Without it the reaction starts on the same frame the screen dies, which reads
 * as a machine responding to an event rather than a person registering one.
 */
const REACTION_DELAY = 320;

/**
 * Floor on how long a reaction is held.
 *
 * Low, because the tag now carries its own timing — four frames of hop across
 * 270ms. It was 700 while the tag was a single held pose, which with real
 * frames would freeze the landing for another 430ms and put the robotic
 * stiffness straight back.
 */
const REACTION_MIN = 120;

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

/**
 * Standing up and sitting down, scored in milliseconds from the click.
 *
 * The two are not mirrors, and cannot be. Going up the person leaves the chair
 * before it can be pushed anywhere, so they move first. Coming down the chair
 * has to arrive before there is anything to sit on, so they move last. Written
 * as two scores rather than one played backwards for exactly that reason.
 *
 * The overlap is what keeps this under a second. Run end to end the beats come
 * to about 1.4s, which is a long time to wait on a control you click
 * repeatedly; started while the one before is still running they come to 800
 * and 920, and nothing reads as rushed because no single beat was shortened.
 *
 * `for` is only given where the runtime owns the duration. The person's beats
 * are as long as their tag, which is the animation's business rather than the
 * schedule's.
 */
const STAND_PLAN = {
  /** Push-off starts immediately: it is what the click is acknowledging. */
  person: { at: 0 },
  /** Shoved back at the moment of push-off, once the anticipation dip is done. */
  chair: { at: 150, for: 630 },
  /**
   * Almost at once, so the desk and the person arrive together.
   *
   * The control is on the desk. Pressing it starts the motor, and standing up
   * is what you do while it runs — the desk is not waiting to see whether you
   * meant it. Held back to 260 it finished a full 200ms after the person did,
   * and for that whole stretch they stood at a desk still down around their
   * waist. The 60 is only so the anticipation dip registers first.
   */
  desk: 60,
} as const;

const SIT_PLAN = {
  chair: { at: 0, for: 630 },
  /**
   * As the chair comes to rest rather than after it. At 540 it is two pixels
   * from home and coasting, which is when a person would already be committing
   * to sit rather than standing and waiting for it to park.
   */
  person: { at: 540 },
  /** Held until the sit begins, for the same reason the rise is not. */
  desk: 520,
} as const;

/**
 * How long a transition runs when its tag has not been drawn yet.
 *
 * Only reached before the art lands. Long enough to hold the schedule's shape
 * so the timing can be tuned against a person who pops rather than moves.
 */
const POSTURE_FALLBACK_MS = 290;

/**
 * The chair's travel curve: full speed at the start, coasting to a stop.
 *
 * A shove, not a slide. Something pushed hard is fastest the instant it leaves
 * your hand and loses speed to the carpet from there, so the acceleration is
 * not animated at all — it happens inside the frame where the push lands. An
 * ease that starts from nothing would read as the chair deciding to leave.
 */
const shove = (p: number) => p * (2 - p);

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

export const createDeskRoom = async (
  canvas: HTMLCanvasElement,
  options: DeskRoomOptions = {},
): Promise<DeskRoom> => {
  const basePath = options.basePath ?? '/art';
  // Only the screen this visit will show. Anything a host names later is
  // fetched then, rather than every screen being shipped to everyone.
  const initialScreen = options.values?.screen ?? DEFAULT_VALUES.screen;
  const assets: Assets = await loadAssets(basePath, [initialScreen], options.outfit);

  /** Already in flight, so repeated `set` calls cannot stack requests. */
  const fetching = new Set<string>();

  /**
   * Make sure the named screen is on its way.
   *
   * The draw falls back to the first scene until it lands, which is a wrong
   * picture for a moment rather than a blank monitor. A host that wants no gap
   * at all should name the screen at construction, where it is awaited.
   */
  const wantScreen = (tag: string) => {
    if (assets.screens.has(tag) || fetching.has(tag)) return;
    fetching.add(tag);
    loadScreen(basePath, tag).then((sheet) => {
      fetching.delete(tag);
      if (sheet) assets.screens.set(tag, sheet);
    });
  };

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

  let night = nightAmountFor(values.lighting, new Date(), timeZone, values.daylight);
  let wash = washFor(values.roomLight === 'on', night);

  const monitor = {
    phase: (values.monitor === 'off' ? 'off' : 'lit') as MonitorPhase,
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
   * Where the occupant is, and the move currently taking them there.
   *
   * `posture` only changes when a move finishes, so everything mid-transition
   * reads the move rather than the posture — which is what keeps the person on
   * their feet for the whole descent instead of snapping into a chair that has
   * not arrived yet.
   *
   * A click during a move is remembered rather than obeyed. Reversing halfway
   * means running two scores that are not mirrors from a shared clock, and the
   * chair and the person disagree about where they are in it; letting the
   * gesture finish and then playing the other one costs up to 900ms and is
   * always a complete movement. Only the last click is kept, so mashing the
   * control cannot build a queue.
   */
  let posture: Posture = 'seated';
  let move: { to: Posture; since: number } | null = null;
  let pending: Posture | null = null;
  let chairShift = 0;

  /** A transition's beat for the person is as long as its tag, once drawn. */
  const postureDuration = (to: Posture) => {
    const tag = POSTURE_TAG[to];
    return assets.character.hasTag(tag) ? assets.character.tagDuration(tag) : POSTURE_FALLBACK_MS;
  };

  const planFor = (to: Posture) => (to === 'standing' ? STAND_PLAN : SIT_PLAN);

  const planTotal = (to: Posture) => {
    const plan = planFor(to);
    return Math.max(plan.person.at + postureDuration(to), plan.chair.at + plan.chair.for);
  };

  /**
   * Drop a posture into place with no sequence, leaving the desk to travel there
   * on its spring.
   *
   * The chair is only out of shot because somebody pushed it there. An empty
   * room's chair is at the desk whatever height the desk is, which is also the
   * only reading that survives a visitor working the control while nobody is
   * home: the desk moves, and no furniture slides around on its own.
   */
  const settleInto = (to: Posture) => {
    posture = to;
    move = null;
    pending = null;
    chairShift = to === 'standing' && values.presence === 'present' ? CHAIR_EXIT : 0;
    deskRaised = to === 'standing';
  };

  if (options.posture === 'standing') {
    settleInto('standing');
    // And the desk is put there rather than sent there. settleInto only moves
    // the spring's target, which is right for a toggle and wrong for an
    // arrival: the room would open at sitting height and rise on its own.
    desk = DESK_RAISED;
  }

  /**
   * The plug. Eased so it drops rather than teleporting, and quickly — it is
   * falling, not travelling.
   */
  let cablePlugged = true;
  let cableFall = 0;

  /**
   * The startle when the power goes.
   *
   * Only fires if somebody is at the desk to be startled — pulling the plug on
   * an empty room just kills the screen quietly. It runs on its own clock
   * rather than the scene's, so it always starts at the tag's first frame.
   */
  let reaction: { phase: 'noticing' | 'surprised'; since: number; tag: string } | null = null;

  let handle = 0;
  let startedAt = 0;

  const step = (time: number) => {
    const now = new Date();

    const nightTarget = nightAmountFor(values.lighting, now, timeZone, values.daylight);
    night = reducedMotion ? nightTarget : night + (nightTarget - night) * EASING;
    const washTarget = washFor(values.roomLight === 'on', night);
    wash = reducedMotion ? washTarget : wash + (washTarget - wash) * EASING;

    if (reaction) {
      const inPhase = time - reaction.since;
      if (reaction.phase === 'noticing' && inPhase >= REACTION_DELAY) {
        // The pose is chosen here rather than at the click, because the delay is
        // long enough to stand up inside. Whichever way they are by the time
        // they actually look up is the one that gets drawn, and it is then held
        // for the rest of the reaction so it cannot switch underneath itself.
        const wanted = STARTLE_TAG[posture];
        reaction = {
          phase: 'surprised',
          since: time,
          tag: assets.character.hasTag(wanted) ? wanted : STARTLE_TAG.seated,
        };
      } else if (reaction.phase === 'surprised') {
        const hold = Math.max(
          assets.character.hasTag(reaction.tag) ? assets.character.tagDuration(reaction.tag) : 0,
          REACTION_MIN,
        );
        if (inPhase >= hold) reaction = null;
      }
    }

    const fallTarget = cablePlugged ? 0 : 1;
    cableFall = reducedMotion ? fallTarget : cableFall + (fallTarget - cableFall) * CABLE_FALL_EASING;
    if (Math.abs(fallTarget - cableFall) < 0.01) cableFall = fallTarget;

    // The stand/sit score, read before the desk spring because one of its beats
    // is what sets the spring's target.
    let postureOneShot: { tag: string; elapsed: number } | undefined;
    let chairReaction: { tag: string; elapsed: number } | undefined;

    if (move) {
      const plan = planFor(move.to);
      const total = planTotal(move.to);
      const inMove = time - move.since;

      if (inMove >= plan.desk) deskRaised = move.to === 'standing';

      const travel = clamp01((inMove - plan.chair.at) / plan.chair.for);
      chairShift =
        move.to === 'standing' ? CHAIR_EXIT * shove(travel) : CHAIR_EXIT * (1 - shove(travel));

      // Held for the rest of the move rather than released when the tag runs
      // out. frameOnce stops on its last frame, and `posture` does not flip
      // until the whole move does, so letting go early would drop them straight
      // back into the pose they just left.
      const inPerson = inMove - plan.person.at;
      if (inPerson >= 0) postureOneShot = { tag: POSTURE_TAG[move.to], elapsed: inPerson };

      const inChair = inMove - plan.chair.at;
      if (move.to === 'standing' && inChair >= 0) {
        chairReaction = { tag: CHAIR_SHOVE_TAG, elapsed: inChair };
      }

      if (inMove >= total) {
        const arrived = move.to;
        const next = pending;
        settleInto(arrived);
        if (next && next !== arrived) move = { to: next, since: time };
      }
    }

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

    // Swapping what is on the screen is not a power event, and now cannot be
    // read as one: the content is a tag the caller hands over and this only ever
    // asks whether there is power.
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
    }

    const inPhase = time - monitor.since;
    if (reducedMotion) {
      monitor.phase = wantOn ? 'lit' : 'off';
    } else if (monitor.phase === 'turning-on' && inPhase >= assets.power.tagDuration('power-on')) {
      monitor.phase = 'lit';
    } else if (
      monitor.phase === 'turning-off' &&
      inPhase >= assets.power.tagDuration('power-off')
    ) {
      monitor.phase = 'off';
    }

    drawScene(context, assets, {
      elapsed: reducedMotion ? 0 : time - startedAt,
      now,
      timeZone,
      screenTag: values.screen,
      reducedMotion,
      wash,
      lightsOn: values.roomLight === 'on',
      hour24: values.clock === '24-hour',
      monitor: { phase: monitor.phase, elapsed: inPhase },
      nightAmount: night,
      weather: values.weather,
      presence: values.presence,
      posture,
      deskOffset: desk,
      cableFall,
      chairShift,
      powered: cablePlugged,
      chairOneShot: chairReaction,
      // A transition outranks the startle. They cannot both be true of the same
      // body, and the startle is already gated to fire only from a settled
      // seat, so this only decides what happens if one is somehow in flight
      // when the other begins.
      //
      // `noticing` has no pose of its own: they have not looked up yet, so
      // presence still decides what the chair looks like.
      characterOneShot:
        postureOneShot ??
        (reaction?.phase === 'surprised'
          ? { tag: reaction.tag, elapsed: time - reaction.since }
          : undefined),
    });

    handle = window.requestAnimationFrame(step);
  };

  return {
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    set(next) {
      values = { ...values, ...next };
      wantScreen(values.screen);
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
      const target: Posture = (move?.to ?? posture) === 'standing' ? 'seated' : 'standing';

      // Nobody here to stand up, so the desk simply travels. settleInto leaves
      // the chair alone when the room is empty, and the spring still carries the
      // desk — an empty chair rolling itself out of shot is a poltergeist rather
      // than a feature.
      if (values.presence !== 'present' || reducedMotion) {
        settleInto(target);
        return;
      }

      // Remembered, not obeyed — see the note on `pending`.
      if (move) {
        pending = target;
        return;
      }
      if (target === posture) return;
      move = { to: target, since: performance.now() };
    },
    toggleCable() {
      cablePlugged = !cablePlugged;
      // Startle only on the way out, only with somebody there, and not on top of
      // a reaction already running — otherwise working the outlet back and
      // forth machine-guns it.
      //
      // Not while a stand or sit is running, though. That is not squeamishness:
      // the posture one-shot outranks the startle in the draw, so the reaction
      // would burn its whole hold behind an animation nobody can see it through.
      //
      // The tag is decided later, when they look up. `noticing` has no pose of
      // its own, so there is nothing to choose yet.
      if (!cablePlugged && values.presence === 'present' && !reaction && !move) {
        reaction = { phase: 'noticing', since: performance.now(), tag: STARTLE_TAG.seated };
      }
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
