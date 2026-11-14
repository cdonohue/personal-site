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
