import * as vscode from 'vscode';
import { Language, resolveLanguage, resolveShortcutLabel } from './i18n';
import { sanitizePrefixes } from './requirements';

export function getPrefixes(): string[] {
  const configured = vscode.workspace
    .getConfiguration('rfHover')
    .get<unknown>('prefixes');
  return sanitizePrefixes(configured);
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
