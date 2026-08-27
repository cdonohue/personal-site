import type { Rect } from './aseprite';
import {
  SCENE_HEIGHT,
  SCENE_WIDTH,
  drawScene,
  loadAssets,
  loadScreen,
} from './render';
import type { Assets, Posture } from './render';
import type { Outfit } from './outfits';
import { SceneEventController, type SceneEventMode } from './events';
import { EVENT_ASSETS } from './sheet-assets';
import { sourceForScreen } from './screens';
import { SceneSimulation } from './simulation';
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
  /** Raise or lower the desk while powered. Returns whether it accepted the command. */
  toggleDesk(): boolean;
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
  /**
   * Change what the figure is wearing, without a reload.
   *
   * For the dev customiser. The page picks an outfit once from the date and
   * never calls this; live editing is the only reason it exists.
   */
  setOutfit(outfit: Outfit): void;
  /** Supply or clear the live video element used by the interactive webcam screen. */
  setCameraSource(source?: HTMLVideoElement): void;
  /**
   * Put the room straight into a posture, the way a page load does.
   *
   * The counterpart to `toggleDesk`, which performs the change: this one simply
   * is it, with no sequence and no travel.
   *
   * Not a `ToggleValues` field, deliberately. `set()` runs on every weather
   * refresh, every dusk check and every click of the light switch, so a posture
   * living in there would re-assert itself on all of them and quietly undo a
   * visitor's desk toggle. A setting that survives being set is a different
   * thing from one that has to be re-applied.
   */
  setPosture(to: Posture): void;
  start(): void;
  stop(): void;
};

export type DeskRoomOptions = {
  /** Where the exported PNG and JSON are served from. Default '/art'. */
  basePath?: string;
  /** Initial values, merged over the defaults. */
  values?: Partial<ToggleValues>;
  /**
   * Screens to fetch alongside the initial one.
   *
   * Usually omitted: a room only pays for what it shows. A host offering a
   * screen picker can preload its choices so changing screens never flashes the
   * fallback while another sheet downloads.
   */
  preloadScreens?: readonly string[];
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
  /** Random by default; a named event loops for URL-driven visual inspection. */
  sceneEvent?: SceneEventMode;
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

export const createDeskRoom = async (
  canvas: HTMLCanvasElement,
  options: DeskRoomOptions = {},
): Promise<DeskRoom> => {
  const basePath = options.basePath ?? '/art';
  // Only the screen this visit will show, unless the host exposes a picker and
  // asks for its choices up front. Anything else named later is fetched then.
  const initialScreen = options.values?.screen ?? DEFAULT_VALUES.screen;
  const assets: Assets = await loadAssets(
    basePath,
    [initialScreen, EVENT_ASSETS.jigsawScreen, ...(options.preloadScreens ?? [])],
    options.outfit,
  );

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
    if (sourceForScreen(tag) !== 'sheet') return;
    if (assets.screens.has(tag) || fetching.has(tag)) return;
    fetching.add(tag);
    loadScreen(basePath, tag).then((sheet) => {
      fetching.delete(tag);
      if (sheet) assets.screens.set(tag, sheet);
    });
  };

  const reducedMotion =
    options.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sceneEvent = new SceneEventController(options.sceneEvent);
  const jigsawAudio = new Audio(`${basePath}/${EVENT_ASSETS.jigsawAudio}`);
  const jigsawSelected = sceneEvent.jigsawSelected();
  jigsawAudio.preload = jigsawSelected ? 'auto' : 'none';
  jigsawAudio.volume = 0.7;
  let jigsawAudioPlayed = false;
  let jigsawAudioAttempted = false;
  let jigsawAudioRunning = false;
  let jigsawAudioReady = false;
  let jigsawEventVisible = false;

  const playJigsawAudio = () => {
    if (!jigsawAudioReady || jigsawAudioPlayed) return;

    // The visitor gesture started this element silently. Rewinding and
    // unmuting an already-playing element does not make a second autoplay
    // request, so the reveal remains synchronized even under strict policies.
    if (jigsawAudioRunning) {
      jigsawAudio.loop = false;
      jigsawAudio.currentTime = 0;
      jigsawAudio.muted = false;
      jigsawAudioPlayed = true;
      return;
    }
    if (jigsawAudioAttempted) return;

    jigsawAudioAttempted = true;
    jigsawAudio.currentTime = 0;
    void jigsawAudio.play().then(() => {
      jigsawAudioRunning = true;
      jigsawAudioPlayed = true;
    }).catch(() => {
      // Opening a forced event URL is not a user gesture, so browsers may
      // reject this first attempt. A pointer press on the scene retries it.
    });
  };

  const unlockJigsawAudio = () => {
    if (!jigsawSelected || reducedMotion) return;
    sceneEvent.interact(performance.now() - startedAt);
    if (jigsawAudioPlayed) return;

    // If the reveal is already visible, the gesture starts the real clip.
    if (jigsawAudioReady) {
      jigsawAudioAttempted = false;
      playJigsawAudio();
      return;
    }
    if (jigsawAudioRunning || jigsawAudioAttempted) return;

    // Keep the user-authorized media element running silently until the
    // reveal. Looping matters because the event delay can exceed this clip.
    jigsawAudioAttempted = true;
    jigsawAudio.muted = true;
    jigsawAudio.loop = true;
    jigsawAudio.currentTime = 0;
    void jigsawAudio.play().then(() => {
      jigsawAudioRunning = true;
      jigsawAudioAttempted = false;
      playJigsawAudio();
    }).catch(() => {
      jigsawAudio.loop = false;
      jigsawAudio.muted = false;
      jigsawAudioAttempted = false;
    });
  };

  // Four backing pixels per scene pixel keep the room's 192x108 coordinate
  // system intact while giving live canvas content inside the monitor enough
  // resolution to remain recognizable. Sprite pixels are still drawn as hard
  // 4x4 blocks; only the nested scene benefits from the denser backing store.
  const renderScale = 4;
  canvas.width = SCENE_WIDTH * renderScale;
  canvas.height = SCENE_HEIGHT * renderScale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('createDeskRoom: could not get a 2d context');
  context.setTransform(renderScale, 0, 0, renderScale, 0, 0);

  const feedbackFrame = document.createElement('canvas');
  feedbackFrame.width = canvas.width;
  feedbackFrame.height = canvas.height;
  const feedbackContext = feedbackFrame.getContext('2d');
  if (!feedbackContext) throw new Error('createDeskRoom: could not create the feedback frame');
  feedbackContext.imageSmoothingEnabled = false;
  let feedbackReady = false;

  const monitorAt = assets.room.slice('monitor-screen');
  const cameraFrame = document.createElement('canvas');
  cameraFrame.width = monitorAt.w;
  cameraFrame.height = monitorAt.h;
  const cameraContext = cameraFrame.getContext('2d');
  if (!cameraContext) throw new Error('createDeskRoom: could not create the camera frame');
  let cameraSource: HTMLVideoElement | undefined;

  const updateCameraFrame = () => {
    if (!cameraSource || cameraSource.readyState < 2 || !cameraSource.videoWidth) return false;

    const sourceRatio = cameraSource.videoWidth / cameraSource.videoHeight;
    const targetRatio = cameraFrame.width / cameraFrame.height;
    const sourceWidth = sourceRatio > targetRatio
      ? cameraSource.videoHeight * targetRatio
      : cameraSource.videoWidth;
    const sourceHeight = sourceRatio > targetRatio
      ? cameraSource.videoHeight
      : cameraSource.videoWidth / targetRatio;
    const sourceX = (cameraSource.videoWidth - sourceWidth) / 2;
    const sourceY = (cameraSource.videoHeight - sourceHeight) / 2;

    cameraContext.save();
    cameraContext.clearRect(0, 0, cameraFrame.width, cameraFrame.height);
    // A local camera should behave like a mirror, not a security feed.
    cameraContext.translate(cameraFrame.width, 0);
    cameraContext.scale(-1, 1);
    cameraContext.drawImage(
      cameraSource,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      cameraFrame.width,
      cameraFrame.height,
    );
    cameraContext.restore();
    return true;
  };

  let values: ToggleValues = { ...DEFAULT_VALUES, ...options.values };
  const timeZone = options.timeZone;
  const simulation = new SceneSimulation({
    values,
    posture: options.posture,
    reducedMotion,
    timeZone,
    now: new Date(),
    durations: {
      characterHasTag: (tag) => assets.character.hasTag(tag),
      characterTagDuration: (tag) => assets.character.tagDuration(tag),
      powerTagDuration: (tag) => assets.power.tagDuration(tag),
    },
  });

  let handle = 0;
  let startedAt = 0;

  const step = (time: number) => {
    const now = new Date();
    const frame = simulation.step(time, now, values);
    const cameraReady = updateCameraFrame();
    const activeEvent = sceneEvent.frameAt(time - startedAt, frame.night, reducedMotion);

    const nextJigsawEventVisible = activeEvent?.kind === 'jigsaw';
    const nextJigsawAudioReady =
      activeEvent?.kind === 'jigsaw' &&
      activeEvent.phase === 'speak' &&
      frame.monitor.phase === 'lit';
    if (jigsawAudioReady && !nextJigsawAudioReady) {
      jigsawAudio.pause();
      jigsawAudio.currentTime = 0;
      jigsawAudio.loop = false;
      jigsawAudio.muted = false;
      jigsawAudioRunning = false;
    }
    if (jigsawEventVisible && !nextJigsawEventVisible) {
      jigsawAudioPlayed = false;
      jigsawAudioAttempted = false;
    }
    jigsawEventVisible = nextJigsawEventVisible;
    jigsawAudioReady = nextJigsawAudioReady;
    playJigsawAudio();

    drawScene(context, assets, {
      elapsed: reducedMotion ? 0 : time - startedAt,
      now,
      timeZone,
      screenTag: values.screen,
      reducedMotion,
      wash: frame.wash,
      lightsOn: values.roomLight === 'on',
      hour24: values.clock === '24-hour',
      monitor: frame.monitor,
      nightAmount: frame.night,
      weather: values.weather,
      presence: values.presence,
      posture: frame.posture,
      deskOffset: frame.deskOffset,
      cableFall: frame.cableFall,
      chairShift: frame.chairShift,
      powered: frame.powered,
      chairOneShot: frame.chairOneShot,
      characterOneShot: frame.characterOneShot,
      feedbackFrame: feedbackReady ? feedbackFrame : undefined,
      cameraFrame: cameraReady ? cameraFrame : undefined,
      sceneEvent: activeEvent,
    });

    // Preserve the completed high-density canvas. The next frame scales this
    // complete image into the monitor instead of reconstructing the room at
    // the monitor's much coarser 46x26 scene-pixel resolution.
    feedbackContext.clearRect(0, 0, feedbackFrame.width, feedbackFrame.height);
    feedbackContext.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      feedbackFrame.width,
      feedbackFrame.height,
    );
    feedbackReady = true;

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
      return simulation.deskOffset();
    },
    toggleDesk() {
      return simulation.toggleDesk(performance.now(), values.presence);
    },
    toggleCable() {
      simulation.toggleCable(performance.now(), values.presence);
    },
    cableUnplugged() {
      return simulation.cableUnplugged();
    },
    setOutfit(next) {
      assets.dressCharacter(next);
    },
    setCameraSource(next) {
      cameraSource = next;
    },
    setPosture(to) {
      simulation.setPosture(to, values.presence);
    },
    start() {
      if (handle) return;
      startedAt = performance.now();
      window.addEventListener('pointerdown', unlockJigsawAudio);
      window.addEventListener('keydown', unlockJigsawAudio);
      handle = window.requestAnimationFrame(step);
    },
    stop() {
      if (!handle) return;
      window.cancelAnimationFrame(handle);
      handle = 0;
      window.removeEventListener('pointerdown', unlockJigsawAudio);
      window.removeEventListener('keydown', unlockJigsawAudio);
      jigsawAudio.pause();
      jigsawAudio.currentTime = 0;
    },
  };
};
