import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRegexes,
  DEFAULT_PREFIXES,
  findReferences,
  parseDefinitions,
  referenceAt,
  sanitizePrefixes,
} from '../requirements';

const regexes = buildRegexes(DEFAULT_PREFIXES);

test('definicao simples em uma linha', () => {
  const defs = parseDefinitions('RF-01: o sistema deve autenticar o usuario', regexes.definition);
  assert.deepEqual(defs, [
    { key: 'RF-1', text: 'o sistema deve autenticar o usuario', line: 0 },
  ]);
});

test('definicao longa e capturada inteira, sem truncar', () => {
  const long = 'x'.repeat(5000);
  const defs = parseDefinitions(`RF-02: ${long}`, regexes.definition);
  assert.equal(defs.length, 1);
  assert.equal(defs[0].text, long);
});

test('definicao aceita marcadores de lista e markdown', () => {
  const text = ['- RF-01: item de lista', '> RN-02: citacao', '## RNF-03: titulo'].join('\n');
  const defs = parseDefinitions(text, regexes.definition);
  assert.deepEqual(
    defs.map((d) => [d.key, d.text, d.line]),
    [
      ['RF-1', 'item de lista', 0],
      ['RN-2', 'citacao', 1],
      ['RNF-3', 'titulo', 2],
    ]
  );
});

test('referencia no meio de frase nao e definicao', () => {
  const defs = parseDefinitions('conforme dito no RF-01 e RF-02 blablabla', regexes.definition);
  assert.equal(defs.length, 0);
});

test('RF-01 e RF-1 normalizam para a mesma chave', () => {
  const refs = findReferences('ver RF-01 e RF-1', regexes.reference);
  assert.deepEqual(
    refs.map((r) => r.key),
    ['RF-1', 'RF-1']
  );
});

test('RNF nao e confundido com RN', () => {
  const refs = findReferences('RNF-03 e RN-02', regexes.reference);
  assert.deepEqual(
    refs.map((r) => [r.key, r.start, r.end]),
    [
      ['RNF-3', 0, 6],
      ['RN-2', 9, 14],
    ]
  );
});

test('prefixo precisa de fronteira de palavra', () => {
  assert.equal(findReferences('xRF-01 RF-01a', regexes.reference).length, 0);
});

test('referenceAt respeita os limites da referencia', () => {
  const line = 'ver RF-01 aqui';
  assert.equal(referenceAt(line, 4, regexes.reference)?.key, 'RF-1');
  assert.equal(referenceAt(line, 8, regexes.reference)?.key, 'RF-1');
  assert.equal(referenceAt(line, 9, regexes.reference), undefined);
  assert.equal(referenceAt(line, 3, regexes.reference), undefined);
});

test('prefixos customizados com caracteres especiais sao escapados', () => {
  const custom = buildRegexes(['REQ', 'R.X']);
  assert.equal(findReferences('R.X-10 e RAX-10', custom.reference).length, 1);
});

test('sanitizePrefixes descarta entradas invalidas e cai no padrao', () => {
  assert.deepEqual(sanitizePrefixes(['RF', ' RN ', '1X', 'a-b', '', 42]), ['RF', 'RN']);
  assert.deepEqual(sanitizePrefixes(['']), DEFAULT_PREFIXES);
  assert.deepEqual(sanitizePrefixes(undefined), DEFAULT_PREFIXES);
});
