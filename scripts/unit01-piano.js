/* Unit 01 — sampled piano.
 *
 * A small sampler over the Salamander Grand Piano (Alexander Holm, CC BY 3.0;
 * see /projects/unit-01/samples/piano/README.md). One recording every three
 * semitones from C2 to C7 (less one weak take); each note plays the nearest
 * one, retuned by a semitone or two, three at most.
 *
 *   Unit01Piano.preload(ctx, lowMidi, highMidi)   fetch what a range needs
 *   Unit01Piano.play(ctx, dest, midi, when, opts) → true if it sounded
 *     opts: { duration (s, until the damper), gain (0–1) }
 *
 * play() returns false while a note's sample is still loading (or failed),
 * so the app can sound its own synth for that note instead: the piano is a
 * progressive enhancement, never a reason for silence.
 *
 * Source: scripts/unit01-piano.js. Copied to
 * public/projects/unit-01/apps/unit01-piano.js by the generator.
 */
(function () {
  'use strict';
  var BASE = '/projects/unit-01/samples/piano/';
  var NAMES = { 0: 'C', 3: 'Ds', 6: 'Fs', 9: 'A' };
  var LOW = 36, HIGH = 96; // C2 … C7
  var buffers = {}; // midi → { buffer, norm } once decoded
  var loading = {}; // midi → promise

  /* Recordings left out. D#5 is a much softer, faster-dying take than its
     neighbours, so notes around it would drop in volume and sustain; they
     use C5 or F#5 instead, retuned by at most three semitones. */
  var SKIP = { 75: true };

  function sampleFor(midi) {
    var m = Math.min(HIGH, Math.max(LOW, Math.round(midi)));
    // Recordings sit on C, D#, F# and A: every MIDI number divisible by 3.
    var below = m - (m % 3), above = below + 3;
    while (SKIP[below]) below -= 3;
    while (SKIP[above]) above += 3;
    if (below < LOW) return above;
    if (above > HIGH) return below;
    // Nearest wins; on a tie, retune a higher recording down, which keeps a
    // piano's timbre better than stretching a lower one up.
    return m - below < above - m ? below : above;
  }
  function fileFor(s) { return BASE + NAMES[s % 12] + (Math.floor(s / 12) - 1) + '.mp3'; }

  /* Level-match the recordings on how loud the note sounds — the RMS of its
     first 0.4 s, attack and early sustain — not on its peak, which is mostly
     the hammer and
     varies a lot between recordings. Without this, neighbouring notes that
     fall on different recordings jump in volume. */
  var TARGET_RMS = 0.08;
  function normFor(buffer) {
    var n = Math.min(buffer.length, Math.round(buffer.sampleRate * 0.4)), sum = 0, count = 0;
    for (var c = 0; c < buffer.numberOfChannels; c++) {
      var d = buffer.getChannelData(c);
      for (var i = 0; i < n; i += 2) { sum += d[i] * d[i]; count++; }
    }
    var rms = Math.sqrt(sum / Math.max(1, count));
    return rms > 0 ? TARGET_RMS / rms : 1;
  }

  function load(ctx, s) {
    if (buffers[s] || loading[s]) return loading[s] || Promise.resolve();
    loading[s] = fetch(fileFor(s))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (data) {
        return new Promise(function (resolve, reject) {
          // The callback form is the one older Safari supports.
          ctx.decodeAudioData(data, resolve, reject);
        });
      })
      .then(function (buffer) { buffers[s] = { buffer: buffer, norm: normFor(buffer) }; })
      .catch(function () { /* stays unloaded; play() falls back */ })
      .then(function () { delete loading[s]; });
    return loading[s];
  }

  function preload(ctx, lo, hi) {
    var jobs = [];
    for (var s = sampleFor(lo); s <= sampleFor(hi); s += 3) if (!SKIP[s]) jobs.push(load(ctx, s));
    return Promise.all(jobs);
  }

  function play(ctx, dest, midi, when, opts) {
    opts = opts || {};
    var s = sampleFor(midi), entry = buffers[s];
    if (!entry) { load(ctx, s); return false; }
    var t = Math.max(when || 0, ctx.currentTime);
    var dur = opts.duration || 1.5, gain = opts.gain == null ? 0.8 : opts.gain;
    var src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = entry.buffer;
    src.playbackRate.value = Math.pow(2, (midi - s) / 12);
    // Hold at the recording's own decay, then let the damper fall: a short
    // fade instead of a cut, which would click.
    var level = gain * entry.norm, release = 0.35;
    g.gain.setValueAtTime(level, t);
    g.gain.setValueAtTime(level, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
    src.connect(g); g.connect(dest);
    src.start(t);
    src.stop(t + dur + release + 0.05);
    return true;
  }

  window.Unit01Piano = { preload: preload, play: play };
})();
