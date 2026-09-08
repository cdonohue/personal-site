import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DECOR_ART_LAYERS,
  DECOR_DEFINITIONS,
  candleGlowAlphaAt,
  decorForMonth,
  decorFromSearch,
  resolveDecor,
} from './decor.ts';

test('each decor slot resolves independently', () => {
  assert.deepEqual(decorForMonth(8), { shelf: 'candle', wall: null });
  assert.deepEqual(decorForMonth(10), { shelf: 'skull-candle', wall: null });
  assert.deepEqual(decorForMonth(12), { shelf: 'snowman', wall: null });
});

test('known decor can be forced with legacy and slot-specific preview URLs', () => {
  assert.deepEqual(decorFromSearch('?decor=skull-candle'), { shelf: 'skull-candle' });
  assert.deepEqual(decorFromSearch('?decor-shelf=candle'), { shelf: 'candle' });
  assert.deepEqual(decorFromSearch('?decor-shelf=none'), { shelf: null });
  assert.equal(decorFromSearch('?decor-wall=candle'), undefined);
  assert.equal(decorFromSearch('?decor=ghost'), undefined);
});

test('forced slots merge over seasonal defaults without disturbing other slots', () => {
  assert.deepEqual(resolveDecor(new Date(2026, 9, 1), { shelf: 'candle' }), {
    shelf: 'candle',
    wall: null,
  });
});

test('decor art exports are derived and deduplicated from the registry', () => {
  assert.deepEqual(DECOR_ART_LAYERS, [
    'skull-candle-glow',
    'candle',
    'skull-candle',
    'snowman',
  ]);
  assert.deepEqual(DECOR_DEFINITIONS.candle.layers.map(({ role }) => role), ['flame', 'body']);
  assert.deepEqual(DECOR_DEFINITIONS['skull-candle'].layers.map(({ role }) => role), [
    'flame',
    'body',
  ]);
});

test('the authored candle glow flickers irregularly within its filter range', () => {
  assert.equal(candleGlowAlphaAt(0), 0.82);
  assert.equal(candleGlowAlphaAt(180), 0.58);
  assert.equal(candleGlowAlphaAt(250), 0.96);
  assert.equal(candleGlowAlphaAt(370), 0.72);
  assert.equal(candleGlowAlphaAt(630), 0.9);
  assert.equal(candleGlowAlphaAt(720), 0.5);
  assert.equal(candleGlowAlphaAt(800), 1);
  assert.equal(candleGlowAlphaAt(1_000), 0.76);
  assert.equal(candleGlowAlphaAt(1_140), 0.88);
  assert.equal(candleGlowAlphaAt(1_360), 0.82);
  assert.equal(candleGlowAlphaAt(180, true), 0.75);
});
