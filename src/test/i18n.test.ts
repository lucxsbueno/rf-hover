import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MESSAGES, resolveLanguage, resolveShortcutLabel } from '../i18n';

test('an explicit setting wins over the editor language', () => {
  assert.equal(resolveLanguage('en', 'pt-BR'), 'en');
  assert.equal(resolveLanguage('pt-br', 'en'), 'pt-br');
});

test('auto follows the editor language', () => {
  assert.equal(resolveLanguage('auto', 'pt-BR'), 'pt-br');
  assert.equal(resolveLanguage('auto', 'pt'), 'pt-br');
  assert.equal(resolveLanguage('auto', 'en'), 'en');
  assert.equal(resolveLanguage('auto', 'de'), 'en');
});

test('an invalid or missing value falls back to auto', () => {
  assert.equal(resolveLanguage('bogus', 'pt-BR'), 'pt-br');
  assert.equal(resolveLanguage(undefined, 'en'), 'en');
  assert.equal(resolveLanguage(42, 'pt'), 'pt-br');
});

test('the en and pt-br catalogs have the same keys', () => {
  assert.deepEqual(Object.keys(MESSAGES.en).sort(), Object.keys(MESSAGES['pt-br']).sort());
});

test('the tip includes the given modifier in both languages', () => {
  assert.match(MESSAGES.en.shortcutTip('Cmd'), /^Tip: Cmd\+click the ID to do the same\.$/);
  assert.match(MESSAGES['pt-br'].shortcutTip('Ctrl'), /^Dica: Ctrl\+clique no ID faz o mesmo\.$/);
});

test('shortcut: Cmd on macOS, Ctrl elsewhere', () => {
  assert.equal(resolveShortcutLabel('darwin', 'alt'), 'Cmd');
  assert.equal(resolveShortcutLabel('linux', 'alt'), 'Ctrl');
  assert.equal(resolveShortcutLabel('win32', 'alt'), 'Ctrl');
});

test('shortcut becomes Alt when multiCursorModifier is ctrlCmd', () => {
  assert.equal(resolveShortcutLabel('darwin', 'ctrlCmd'), 'Alt');
  assert.equal(resolveShortcutLabel('linux', 'ctrlCmd'), 'Alt');
});
