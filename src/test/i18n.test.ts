import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MESSAGES, resolveLanguage, resolveShortcutLabel } from '../i18n';

test('configuracao explicita tem prioridade sobre o idioma do editor', () => {
  assert.equal(resolveLanguage('en', 'pt-BR'), 'en');
  assert.equal(resolveLanguage('pt-br', 'en'), 'pt-br');
});

test('auto segue o idioma do editor', () => {
  assert.equal(resolveLanguage('auto', 'pt-BR'), 'pt-br');
  assert.equal(resolveLanguage('auto', 'pt'), 'pt-br');
  assert.equal(resolveLanguage('auto', 'en'), 'en');
  assert.equal(resolveLanguage('auto', 'de'), 'en');
});

test('valor invalido ou ausente cai em auto', () => {
  assert.equal(resolveLanguage('bogus', 'pt-BR'), 'pt-br');
  assert.equal(resolveLanguage(undefined, 'en'), 'en');
  assert.equal(resolveLanguage(42, 'pt'), 'pt-br');
});

test('catalogos en e pt-br tem as mesmas chaves', () => {
  assert.deepEqual(Object.keys(MESSAGES.en).sort(), Object.keys(MESSAGES['pt-br']).sort());
});

test('dica inclui o modificador informado nos dois idiomas', () => {
  assert.match(MESSAGES.en.shortcutTip('Cmd'), /^Tip: Cmd\+click the ID to do the same\.$/);
  assert.match(MESSAGES['pt-br'].shortcutTip('Ctrl'), /^Dica: Ctrl\+clique no ID faz o mesmo\.$/);
});

test('atalho: Cmd no macOS, Ctrl nos demais', () => {
  assert.equal(resolveShortcutLabel('darwin', 'alt'), 'Cmd');
  assert.equal(resolveShortcutLabel('linux', 'alt'), 'Ctrl');
  assert.equal(resolveShortcutLabel('win32', 'alt'), 'Ctrl');
});

test('atalho vira Alt quando multiCursorModifier e ctrlCmd', () => {
  assert.equal(resolveShortcutLabel('darwin', 'ctrlCmd'), 'Alt');
  assert.equal(resolveShortcutLabel('linux', 'ctrlCmd'), 'Alt');
});
