// Texts and presentation helpers. No vscode dependency, so it can be unit tested.

export type Language = 'en' | 'pt-br';
export type LanguageSetting = 'auto' | Language;

export interface Messages {
  goToDefinition: string;
  shortcutTip: (modifier: string) => string;
}

export const MESSAGES: Record<Language, Messages> = {
  en: {
    goToDefinition: 'Go to definition',
    shortcutTip: (modifier) => `Tip: ${modifier}+click the ID to do the same.`,
  },
  'pt-br': {
    goToDefinition: 'Ir para a definição',
    shortcutTip: (modifier) => `Dica: ${modifier}+clique no ID faz o mesmo.`,
  },
};

/**
 * Picks the extension language.
 * An explicit "en" or "pt-br" wins; "auto" (or an invalid value) uses the editor language.
 */
export function resolveLanguage(setting: unknown, editorLanguage: string): Language {
  if (setting === 'en' || setting === 'pt-br') {
    return setting;
  }
  return editorLanguage.toLowerCase().startsWith('pt') ? 'pt-br' : 'en';
}

/**
 * Click modifier name shown in the tip (Cmd on macOS, Ctrl elsewhere).
 * With editor.multiCursorModifier = "ctrlCmd", "go to definition" becomes Alt+click.
 */
export function resolveShortcutLabel(platform: string, multiCursorModifier: string): string {
  if (multiCursorModifier === 'ctrlCmd') {
    return 'Alt';
  }
  return platform === 'darwin' ? 'Cmd' : 'Ctrl';
}
