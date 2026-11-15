/**
 * What the Unit 01 explorer contains: its sections and its apps.
 *
 * The apps themselves are self-contained HTML files in
 * `public/projects/unit-01/apps/<slug>/`, exactly as handed off; this is only
 * the index of them.
 */

export const BASE = '/projects/unit-01'

export const sections = [
  { label: 'Overview', to: `${BASE}/`, end: true },
  { label: 'Components', to: `${BASE}/components` },
  { label: 'Apps', to: `${BASE}/apps` },
]

export type App = {
  /** Folder name under public/projects/unit-01/apps, e.g. `01-metronome`. */
  slug: string
  name: string
  /** The core idea, one line. */
  idea: string
  /** What fills the larger layouts. */
  features: string
  /** Anything that needs permission or has a known gap. */
  note?: string
}

export const apps: App[] = [
  { slug: '01-metronome', name: 'Metronome', idea: 'Web Audio metronome with tap tempo, accents and subdivisions.', features: 'Beat pattern keys, tempo fader, meter, sound, presets, session stats.', note: 'Sound starts after the first tap.' },
  { slug: '02-tuner', name: 'Tuner', idea: 'Pitch detection from the microphone, plus reference tones.', features: '21-segment cents meter, strings per instrument, A4 from 415 to 466 Hz, pitch trace.', note: 'Asks for microphone access.' },
  { slug: '03-drum-machine', name: 'Drum Machine', idea: 'Sixteen steps, four synthesised voices.', features: 'Swing, mixer knobs, presets, playhead.' },
  { slug: '04-drone', name: 'Drone', idea: 'A held root or chord to practise against.', features: 'Chord modes, four voices, fade, breathing LFO, A4 calibration.' },
  { slug: '05-ear-trainer', name: 'Ear Trainer', idea: 'Interval and chord quiz.', features: 'Levels, streak, accuracy bars.' },
  { slug: '06-chords', name: 'Chord Finder', idea: 'Name chords from a piano or fretboard.', features: 'Inversions and slash chords, reverse build.', note: 'Sharps only.' },
  { slug: '07-timer', name: 'Timer', idea: 'A countdown set with a knob.', features: 'Presets, Pomodoro, alarm with flash, log.' },
  { slug: '08-stopwatch', name: 'Stopwatch', idea: 'Laps and splits.', features: 'Fastest lap in orange, stats.' },
  { slug: '09-world-clock', name: 'World Clock', idea: 'Local time and six cities, correct across daylight saving.', features: '24-hour overlap strip, time scrubber, 12 or 24 hour.' },
  { slug: '10-counter', name: 'Counter', idea: 'Named tallies.', features: 'Step, goal, two-tap reset, history.' },
  { slug: '11-converter', name: 'Converter', idea: 'Nine categories of units.', features: 'All-units table, endless nudge dial, recent conversions.', note: 'Currency uses a typed-in rate.' },
  { slug: '12-dice', name: 'Dice', idea: 'Dice, coin and pick-one.', features: 'Holds, history, distribution.' },
  { slug: '13-level', name: 'Level', idea: 'Bubble and edge spirit level.', features: 'Zero, hold, beep when level, drag demo mode.', note: 'Needs a phone’s tilt sensor.' },
  { slug: '14-habits', name: 'Habits', idea: 'Up to eight habits on a day grid.', features: 'One, four or twelve weeks, streaks, backup and restore.' },
  { slug: '15-synth', name: 'Synth', idea: 'A playable mono or poly synth.', features: 'Oscillator, filter, envelope, delay, presets, scope, computer-key play.' },
  { slug: '16-calculator', name: 'Calculator', idea: 'A hardware calculator.', features: 'Scientific keys, memory, history, full keyboard.' },
  { slug: '17-intervals', name: 'Intervals', idea: 'A HIIT timer.', features: 'Tabata, EMOM and 30/30 presets, beeps, timeline.' },
  { slug: '18-noise', name: 'Noise', idea: 'White, pink and brown noise.', features: 'Waves LFO, sleep timer with fade, mixer.' },
  { slug: '19-breathe', name: 'Breathe', idea: 'Box, 4-7-8, even or custom breathing.', features: 'Growing square, tone cues, log.' },
  { slug: '20-split', name: 'Split', idea: 'A bill and tip per person, in whole cents.', features: 'Split by item, receipt, copy.' },
  { slug: '21-score', name: 'Score', idea: 'Scorekeeper for two to eight players.', features: 'Rounds table, undo, wins.' },
  { slug: '22-colour', name: 'Colour', idea: 'An OKLCH, HSL and RGB mixer.', features: 'Contrast checker, palette, harmonies.' },
  { slug: '23-countdown', name: 'Countdown', idea: 'Days until the events that matter.', features: 'Yearly repeats, live clock inside 48 hours, calendar strip.' },
  { slug: '24-passwords', name: 'Passwords', idea: 'Random passwords, passphrases and PINs.', features: 'Entropy meter, masked history that is never saved, crack time.' },
]

export const appHref = (app: App) => `${BASE}/apps/${app.slug}/`

/*
 * ── Weights ────────────────────────────────────────────────────────────────
 *
 * How much each part of an app matters, which decides what it is guaranteed
 * at every size (the design system's rule 8):
 *
 * - core: needed to do the app's job, including setting it up. Reachable at
 *   every size: inline when there is room, otherwise in the More sheet.
 * - supporting: tunes how it works. Inline when there is room, otherwise one
 *   tap away in the More sheet.
 * - enhancement: adds information or speed. Shown only when there is room.
 *
 * Keys are CSS selectors for a module, panel or key in the app's own markup.
 * Anything not listed is part of the app's always-visible frame. The runtime
 * is public/projects/unit-01/apps/unit01-weights.js; `npm run unit01:audit`
 * fails if a core part cannot be reached at any test size.
 */
export type Weight = 'core' | 'supporting' | 'enhancement'

export const weights: Record<string, Record<string, Weight>> = {
  '01-metronome': { '.beats': 'core', '.p-meter': 'core', '#tap': 'supporting', '.p-tempo': 'supporting', '.p-sound': 'supporting', '.p-presets': 'enhancement', '.p-stats': 'enhancement' },
  '02-tuner': { '.strings': 'core', '.p-inst': 'core', '#down': 'supporting', '#up': 'supporting', '.p-cal': 'supporting', '.p-sound': 'supporting', '.p-chrom': 'enhancement' },
  // On phones the sequencer swaps in a voice selector and shows one row at a
  // time; that is a change of form, not a loss, so the rows need no weight.
  '03-drum-machine': { '.seq': 'core', '.p-tempo': 'core', '#tap': 'supporting', '.p-mixer': 'supporting', '.p-presets': 'enhancement' },
  '04-drone': { '.notes': 'core', '.p-chord': 'core', '#oct': 'supporting', '.p-voice': 'supporting', '.p-cal': 'supporting' },
  '05-ear-trainer': { '.p-mode': 'core', '.p-level': 'core' },
  // Guitar input needs the width of a fretboard, so it is an enhancement: the
  // piano covers every chord where the fretboard cannot fit.
  '06-chords': { '.transport': 'core', '.p-build': 'supporting', '#modeSel': 'enhancement' },
  '07-timer': { '.p-set': 'core', '.presets': 'supporting', '#minus': 'supporting', '#plus': 'supporting', '.p-cycle': 'supporting' },
  '08-stopwatch': { '#reset': 'core' },
  '09-world-clock': { '.cities': 'core', '.p-add': 'core', '.p-set': 'supporting', '.p-over': 'enhancement' },
  '10-counter': { '.chips': 'core', '#reset': 'core', '.p-list': 'core', '.p-step': 'supporting' },
  '11-converter': { '.io': 'core', '.p-cats': 'core', '#nudge': 'supporting', '.p-table': 'enhancement' },
  '12-dice': { '.tray': 'core', '#typeKey': 'core', '.p-setup': 'core', '.p-history': 'enhancement' },
  '13-level': { '.modes': 'core', '.p-opts': 'supporting', '.p-read': 'enhancement' },
  '14-habits': { '.grid': 'core', '.p-habits': 'core' },
  '15-synth': { '.transport': 'supporting', '.presets': 'supporting', '.p-osc': 'supporting', '.p-filter': 'supporting', '.p-env': 'supporting', '.p-fx': 'supporting' },
  '16-calculator': { '.mem': 'supporting', '.p-sci': 'enhancement', '.p-hist': 'enhancement' },
  '17-intervals': { '.p-set': 'core', '#reset': 'core', '.presets': 'supporting' },
  '18-noise': { '.colours': 'core', '#timerKey': 'supporting', '.p-sound': 'supporting', '.p-sleep': 'supporting', '.p-mix': 'enhancement' },
  '19-breathe': { '.pattern': 'core', '#patKey': 'supporting', '.p-custom': 'supporting', '.p-session': 'enhancement' },
  '20-split': { '.tip': 'core', '.p-opts': 'core', '.p-items': 'supporting', '.p-break': 'enhancement', '.p-receipt': 'enhancement' },
  '21-score': { '.players': 'core', '.p-roster': 'core', '#undo': 'core', '#prev': 'supporting', '.p-step': 'supporting', '.p-rounds': 'enhancement' },
  // The faders duplicate the knobs, which every size shows.
  '22-colour': { '.mixer': 'core', '.codes': 'supporting', '#save': 'supporting', '.p-contrast': 'enhancement', '.p-palette': 'enhancement' },
  '23-countdown': { '.events': 'core', '.p-add': 'core', '#soonest': 'supporting' },
  '24-passwords': { '.settings': 'core', '.p-history': 'enhancement' },
}

/*
 * ── Glyphs ─────────────────────────────────────────────────────────────────
 *
 * What each app is, drawn in the system's icon style: solid geometric shapes
 * on a 24px grid in currentColor (a few use a 2.5px square-capped stroke where
 * a line is the whole idea). Used for the home-screen icons and the Apps page.
 */
const S = 'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"'

export const glyphs: Record<string, string> = {
  // A pyramid metronome with its pendulum cut out.
  '01-metronome': '<path fill-rule="evenodd" d="M9 2h6l5 20H4zm1.9 17.5h2.8l3.6-11.3-2.6-.9z"/>',
  // A tuning fork.
  '02-tuner': '<path d="M6 2h3v9a3 3 0 0 0 6 0V2h3v9a6 6 0 0 1-4.5 5.8V22h-3v-5.2A6 6 0 0 1 6 11z"/>',
  // A 3×3 pad grid with the current step hollow.
  '03-drum-machine': '<path fill-rule="evenodd" d="M3 3h5v5H3zm6.5 0h5v5h-5zM16 3h5v5h-5zM3 9.5h5v5H3zm6.5 0h5v5h-5zm1.5 1.5v2h2v-2zM16 9.5h5v5h-5zM3 16h5v5H3zm6.5 0h5v5h-5zM16 16h5v5h-5z"/>',
  // A held sine wave over a ground line.
  '04-drone': `<path ${S} d="M3 11c2.2-5.3 4.3-5.3 6 0s3.8 5.3 6 0 3.8-5.3 6 0"/><path d="M3 19h18v2.5H3z"/>`,
  // Two beamed notes: an interval.
  '05-ear-trainer': '<path d="M7 3.5 20 1v14.2a3.3 3.3 0 1 1-2.5-3.2V6.2l-8 1.6v10.4a3.3 3.3 0 1 1-2.5-3.2z"/>',
  // Three piano keys with two black keys between them.
  '06-chords': '<path fill-rule="evenodd" d="M2 4h20v16H2zm2 2v12h4.2v-5H6.4V6zm5.8 7v5h4.4v-5h-1.1V6h-2.2v7zm6 0v5H20V6h-2.4v7z"/>',
  // An hourglass.
  '07-timer': '<path d="M5 2h14v2.5h-1.5V7l-4.2 5 4.2 5v2.5H19V22H5v-2.5h1.5V17l4.2-5-4.2-5V4.5H5z"/>',
  // A stopwatch: ring, crown, hand.
  '08-stopwatch': '<path fill-rule="evenodd" d="M9 1h6v2.5h-1.8v1.6A8.5 8.5 0 1 1 10.8 5V3.5H9zm3 6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm-1.2 1.5h2.4v5h-2.4z"/>',
  // A globe: outline, meridian and equator.
  '09-world-clock': `<circle ${S} cx="12" cy="12" r="9"/><ellipse ${S} cx="12" cy="12" rx="4" ry="9"/><path ${S} d="M3.5 12h17"/>`,
  // Tally marks: four and a strike.
  '10-counter': '<path d="M4 4h2.5v16H4zm5 0h2.5v16H9zm5 0h2.5v16H14zm5 0h2.5v16H19z"/><path d="m2.2 15.6 19-8 1 2.3-19 8z"/>',
  // Two opposing arrows.
  '11-converter': '<path d="M3 6h13.2l-3.6-3.6L14 1l6 6-6 6-1.4-1.4L16.2 8H3zM21 18H7.8l3.6 3.6L10 23l-6-6 6-6 1.4 1.4L7.8 16H21z"/>',
  // A die showing three.
  '12-dice': '<path fill-rule="evenodd" d="M3 3h18v18H3zm4.5 2.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm9 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4.5-4.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
  // A spirit level with its bubble centred between the marks.
  '13-level': '<path fill-rule="evenodd" d="M1 8h22v8H1zm11 1.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4zM8 9.5H6.6v5H8zm9.4 0H16v5h1.4z"/>',
  // A day ticked off.
  '14-habits': `<path fill-rule="evenodd" d="M3 3h18v18H3zm2.5 2.5v13h13v-13z"/><path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square" stroke-linejoin="miter" d="m8 12.4 2.8 2.8 5.4-6.4"/>`,
  // A square wave over keys.
  '15-synth': `<path ${S} d="M2.5 10h4V4h6v6h6V4h3"/><path fill-rule="evenodd" d="M2 14h20v8H2zm4.4 0v4.5h1.8V14zm4.7 0v4.5h1.8V14zm4.7 0v4.5h1.8V14z"/>`,
  // A calculator: screen and keys cut out.
  '16-calculator': '<path fill-rule="evenodd" d="M4 1h16v22H4zm2.5 2.5v5h11v-5zM6.5 11v2.5H9V11zm4.25 0v2.5h2.5V11zM15 11v2.5h2.5V11zm-8.5 4.25v2.5H9v-2.5zm4.25 0v2.5h2.5v-2.5zM15 15.25v6.25h2.5v-6.25zm-8.5 4V21.5H9v-2.25zm4.25 0V21.5h2.5v-2.25z"/>',
  // A bolt: work and rest in bursts.
  '17-intervals': '<path d="M14 1 4 14h6.5L9 23l11-13h-6.6z"/>',
  // A noise spectrum.
  '18-noise': '<path d="M2 13h2.2v6H2zm3.4-5h2.2v11H5.4zm3.4 3h2.2v8H8.8zm3.4-7h2.2v15h-2.2zm3.4 6h2.2v9h-2.2zm3.4-3h2.2v12H19z"/>',
  // Box breathing: a square path with the breath inside.
  '19-breathe': '<path fill-rule="evenodd" d="M2 2h20v20H2zm2.5 2.5v15h15v-15z"/><path d="M8.5 8.5h7v7h-7z"/>',
  // Division: one bill, several people.
  '20-split': '<circle cx="12" cy="5" r="2.6"/><circle cx="12" cy="19" r="2.6"/><path d="M3 10.7h18v2.6H3z"/>',
  // A trophy.
  '21-score': '<path fill-rule="evenodd" d="M6 2h12v2h4v4a5 5 0 0 1-5 5h-.4a6 6 0 0 1-3.3 3V19H17v3H7v-3h3.7v-3a6 6 0 0 1-3.3-3H7a5 5 0 0 1-5-5V4h4zm-1.5 4.5V8A2.5 2.5 0 0 0 6 10.4V6.5zm15 0H18v3.9A2.5 2.5 0 0 0 19.5 8z"/>',
  // Three overlapping discs: mixing colour.
  '22-colour': '<path fill-rule="evenodd" d="M8.5 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm7 0a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM12 9.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z"/>',
  // A calendar with one day marked.
  '23-countdown': '<path fill-rule="evenodd" d="M6 1h2.5v2.5h7V1H18v2.5h4V22H2V3.5h4zM4.5 9v10.5h15V9zm9 5h4v4h-4z"/>',
  // A key.
  '24-passwords': '<path fill-rule="evenodd" d="M7.5 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12.6 10.7H23v2.6h-2.2V17h-2.6v-3.7h-1.6V16h-2.6v-2.7h-1.4z"/>',
}
