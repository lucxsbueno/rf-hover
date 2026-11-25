import * as vscode from 'vscode';
import { Language, resolveLanguage, resolveShortcutLabel } from './i18n';
import { resolvePrefixes } from './requirements';

export function getPrefixes(): string[] {
  const config = vscode.workspace.getConfiguration('rfHover');
  return resolvePrefixes(config.get<unknown>('prefixes'), config.get<unknown>('disabledPrefixes'));
}

export function getLanguage(): Language {
  const setting = vscode.workspace.getConfiguration('rfHover').get<unknown>('language', 'auto');
  return resolveLanguage(setting, vscode.env.language);
}

export function getShortcutModifier(): string {
  const multiCursorModifier = vscode.workspace
    .getConfiguration('editor')
    .get<string>('multiCursorModifier', 'alt');
  return resolveShortcutLabel(process.platform, multiCursorModifier);
}
