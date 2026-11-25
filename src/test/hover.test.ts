import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { installVscodeStub, stubState } from './vscodeStub';

installVscodeStub();

// Importados depois do stub, porque os modulos da extensao usam require('vscode').
const { createHoverProvider } = require('../hover') as typeof import('../hover');
const { RequirementIndex } = require('../requirementIndex') as typeof import('../requirementIndex');
const { MESSAGES, resolveShortcutLabel } = require('../i18n') as typeof import('../i18n');

const COMMAND_LINK = /command:rfHover\.goToDefinition\?([^)]+)\)/g;

function makeIndex() {
  const index = new RequirementIndex(['RF', 'RN', 'RNF']);
  index.updateFile(
    'file:///ws/requisitos.md',
    'intro\n- RF-01: o sistema deve permitir login\nRNF-03: desempenho abaixo de 2s\n'
  );
  index.updateFile('file:///ws/docs/extra.md', 'RF-01: segunda definicao\n');
  return index;
}

function hoverAt(index: InstanceType<typeof RequirementIndex>, text: string, character: number) {
  const lines = text.split('\n');
  const document = { lineAt: (i: number) => ({ text: lines[i] }) };
  const provider = createHoverProvider(index);
  // Hover real recebe TextDocument; aqui basta o que a extensao usa.
  return provider.provideHover(document as any, { line: 0, character } as any, undefined as any) as any;
}

function linksIn(value: string): Array<[string, number]> {
  return [...value.matchAll(COMMAND_LINK)].map((m) => JSON.parse(decodeURIComponent(m[1])));
}

beforeEach(() => {
  stubState.language = 'en';
  stubState.config = {};
});

test('hover lista todas as definicoes com um link cada e uma unica dica', () => {
  const hover = hoverAt(makeIndex(), 'Conforme RF-1 aqui', 10);
  const value: string = hover.contents.value;

  assert.equal([...value.matchAll(COMMAND_LINK)].length, 2);
  assert.equal(value.split('Tip:').length - 1, 1);
  assert.match(value, /requisitos\.md:2/);
  assert.match(value, /extra\.md:1/);
  assert.match(value, /o sistema deve permitir login/);
  assert.match(value, /segunda definicao/);
});

test('hover marca o comando como confiavel para o link funcionar', () => {
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.deepEqual(hover.contents.isTrusted, { enabledCommands: ['rfHover.goToDefinition'] });
});

test('argumentos do link apontam para uri e linha da definicao', () => {
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.deepEqual(linksIn(hover.contents.value), [
    ['file:///ws/requisitos.md', 1],
    ['file:///ws/docs/extra.md', 0],
  ]);
});

test('texto em ingles por padrao, com dica usando Cmd ou Ctrl', () => {
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  const label = resolveShortcutLabel(process.platform, 'alt');
  assert.match(hover.contents.value, /Go to definition/);
  assert.ok(hover.contents.value.includes(MESSAGES.en.shortcutTip(label)));
  assert.ok(label === 'Cmd' || label === 'Ctrl');
});

test('configuracao pt-br troca os textos', () => {
  stubState.config['rfHover.language'] = 'pt-br';
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.match(hover.contents.value, /Ir para a definição/);
  assert.match(hover.contents.value, /Dica: /);
});

test('auto segue o idioma do editor', () => {
  stubState.language = 'pt-BR';
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.match(hover.contents.value, /Ir para a definição/);
});

test('multiCursorModifier ctrlCmd faz a dica mostrar Alt', () => {
  stubState.config['editor.multiCursorModifier'] = 'ctrlCmd';
  const hover = hoverAt(makeIndex(), 'RF-01', 1);
  assert.ok(hover.contents.value.includes('Tip: Alt+click the ID to do the same.'));
});

test('referencia sem definicao nao gera hover', () => {
  assert.equal(hoverAt(makeIndex(), 'RF-99', 1), undefined);
});
