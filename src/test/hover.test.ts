import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { installVscodeStub, stubState } from './vscodeStub';

installVscodeStub();

// Imported after the stub, because the extension modules use require('vscode').
const { createHoverProvider } = require('../hover') as typeof import('../hover');
const { RequirementIndex } = require('../requirementIndex') as typeof import('../requirementIndex');
const { MESSAGES, resolveShortcutLabel } = require('../i18n') as typeof import('../i18n');

const COMMAND_LINK = /command:rfHover\.goToDefinition\?([^)]+)\)/g;

function makeIndex() {
  const index = new RequirementIndex(['RF', 'RN', 'RNF']);
  index.updateFile(
    'file:///ws/requirements.md',
    'intro\n- RF-01: o sistema deve permitir login\nRNF-03: desempenho abaixo de 2s\n'
  );
  index.updateFile('file:///ws/docs/extra.md', 'RF-01: second definition\n');
  return index;
}

function hoverAt(index: InstanceType<typeof RequirementIndex>, text: string, character: number) {
  const lines = text.split('\n');
  const document = { lineAt: (i: number) => ({ text: lines[i] }) };
  const provider = createHoverProvider(index);
  // A real hover receives a TextDocument; here only what the extension uses is needed.
  return provider.provideHover(document as any, { line: 0, character } as any, undefined as any) as any;
}

function linksIn(value: string): Array<[string, number]> {
  return [...value.matchAll(COMMAND_LINK)].map((m) => JSON.parse(decodeURIComponent(m[1])));
}

beforeEach(() => {
  stubState.language = 'en';
  stubState.config = {};
});

test('hover lists every definition with one link each and a single tip', () => {
  const hover = hoverAt(makeIndex(), 'Conforme RF-1 aqui', 10);
  const value: string = hover.contents.value;

  assert.equal([...value.matchAll(COMMAND_LINK)].length, 2);
  assert.equal(value.split('Tip:').length - 1, 1);
  assert.match(value, /requirements\.md:2/);
  assert.match(value, /extra\.md:1/);
  assert.match(value, /o sistema deve permitir login/);
  assert.match(value, /second definition/);
});

test('hover marks the command as trusted so the link works', () => {
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.deepEqual(hover.contents.isTrusted, { enabledCommands: ['rfHover.goToDefinition'] });
});

test('link arguments point to the definition uri and line', () => {
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.deepEqual(linksIn(hover.contents.value), [
    ['file:///ws/requirements.md', 1],
    ['file:///ws/docs/extra.md', 0],
  ]);
});

test('English text by default, with a Cmd or Ctrl tip', () => {
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  const label = resolveShortcutLabel(process.platform, 'alt');
  assert.match(hover.contents.value, /Go to definition/);
  assert.ok(hover.contents.value.includes(MESSAGES.en.shortcutTip(label)));
  assert.ok(label === 'Cmd' || label === 'Ctrl');
});

test('the pt-br setting switches the texts', () => {
  stubState.config['rfHover.language'] = 'pt-br';
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.match(hover.contents.value, /Ir para a definição/);
  assert.match(hover.contents.value, /Dica: /);
});

test('auto follows the editor language', () => {
  stubState.language = 'pt-BR';
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.match(hover.contents.value, /Ir para a definição/);
});

test('multiCursorModifier ctrlCmd makes the tip show Alt', () => {
  stubState.config['editor.multiCursorModifier'] = 'ctrlCmd';
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.ok(hover.contents.value.includes('Tip: Alt+click the ID to do the same.'));
});

test('a reference without a definition produces no hover', () => {
  assert.equal(hoverAt(makeIndex(), 'RF-99', 1), undefined);
});
