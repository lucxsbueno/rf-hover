import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRegexes,
  DEFAULT_PREFIXES,
  findReferences,
  parseDefinitions,
  referenceAt,
  resolvePrefixes,
  sanitizePrefixList,
} from '../requirements';

const regexes = buildRegexes(DEFAULT_PREFIXES);

test('simple one-line definition', () => {
  const defs = parseDefinitions('RF-01: the system must authenticate the user', regexes.definition);
  assert.deepEqual(defs, [
    { key: 'RF-1', text: 'the system must authenticate the user', line: 0 },
  ]);
});

test('long definition is captured whole, without truncating', () => {
  const long = 'x'.repeat(5000);
  const defs = parseDefinitions(`RF-02: ${long}`, regexes.definition);
  assert.equal(defs.length, 1);
  assert.equal(defs[0].text, long);
});

test('definition accepts list and markdown markers', () => {
  const text = ['- RF-01: list item', '> RN-02: quote', '## RNF-03: heading'].join('\n');
  const defs = parseDefinitions(text, regexes.definition);
  assert.deepEqual(
    defs.map((d) => [d.key, d.text, d.line]),
    [
      ['RF-1', 'list item', 0],
      ['RN-2', 'quote', 1],
      ['RNF-3', 'heading', 2],
    ]
  );
});

test('a reference mid-sentence is not a definition', () => {
  const defs = parseDefinitions('conforme dito no RF-01 e RF-02 blablabla', regexes.definition);
  assert.equal(defs.length, 0);
});

test('RF-01 and RF-1 normalize to the same key', () => {
  const refs = findReferences('ver RF-01 e RF-1', regexes.reference);
  assert.deepEqual(
    refs.map((r) => r.key),
    ['RF-1', 'RF-1']
  );
});

test('RNF is not mistaken for RN', () => {
  const refs = findReferences('RNF-03 e RN-02', regexes.reference);
  assert.deepEqual(
    refs.map((r) => [r.key, r.start, r.end]),
    [
      ['RNF-3', 0, 6],
      ['RN-2', 9, 14],
    ]
  );
});

test('a prefix needs a word boundary', () => {
  assert.equal(findReferences('xRF-01 RF-01a', regexes.reference).length, 0);
});

test('referenceAt respects the reference boundaries', () => {
  const line = 'ver RF-01 aqui';
  assert.equal(referenceAt(line, 4, regexes.reference)?.key, 'RF-1');
  assert.equal(referenceAt(line, 8, regexes.reference)?.key, 'RF-1');
  assert.equal(referenceAt(line, 9, regexes.reference), undefined);
  assert.equal(referenceAt(line, 3, regexes.reference), undefined);
});

test('custom prefixes with special characters are escaped', () => {
  const custom = buildRegexes(['REQ', 'R.X']);
  assert.equal(findReferences('R.X-10 e RAX-10', custom.reference).length, 1);
});

test('sanitizePrefixList drops invalid and repeated entries', () => {
  assert.deepEqual(sanitizePrefixList(['RF', ' RN ', '1X', 'a-b', '', 42, 'RF']), ['RF', 'RN']);
  assert.deepEqual(sanitizePrefixList(['']), []);
  assert.deepEqual(sanitizePrefixList(undefined), []);
});

test('resolvePrefixes adds extras on top of the defaults', () => {
  const result = resolvePrefixes(['REQ'], undefined);
  assert.deepEqual(result, [...DEFAULT_PREFIXES, 'REQ']);
});

test('resolvePrefixes keeps the defaults when only extras are set', () => {
  const result = resolvePrefixes(['RF', 'RN', 'RNF'], undefined);
  for (const prefix of ['FR', 'NFR', 'UC', 'US', 'BR']) {
    assert.ok(result.includes(prefix), `${prefix} should stay active`);
  }
});

test('resolvePrefixes removes defaults listed in disabledPrefixes', () => {
  const result = resolvePrefixes(undefined, ['BR', 'US']);
  assert.ok(!result.includes('BR'));
  assert.ok(!result.includes('US'));
  assert.ok(result.includes('RF'));
});

test('with no active prefixes nothing is recognized', () => {
  const none = buildRegexes([]);
  assert.equal(findReferences('RF-01 RN-02', none.reference).length, 0);
  assert.equal(parseDefinitions('RF-01: text', none.definition).length, 0);
});
