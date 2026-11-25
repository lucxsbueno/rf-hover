// Textos e helpers de apresentacao. Sem dependencia do vscode, para poder ser testado.

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
 * Escolhe o idioma da extensao.
 * Configuracao "en" ou "pt-br" tem prioridade; em "auto" (ou valor invalido) usa o idioma do editor.
 */
export function resolveLanguage(setting: unknown, editorLanguage: string): Language {
  if (setting === 'en' || setting === 'pt-br') {
    return setting;
  }
  return editorLanguage.toLowerCase().startsWith('pt') ? 'pt-br' : 'en';
}

/**
 * Nome do modificador de clique para a dica (Cmd no macOS, Ctrl nos demais).
 * Com editor.multiCursorModifier = "ctrlCmd", o "ir para definicao" passa a ser Alt+clique.
 */
export function resolveShortcutLabel(platform: string, multiCursorModifier: string): string {
  if (multiCursorModifier === 'ctrlCmd') {
    return 'Alt';
  }
  return platform === 'darwin' ? 'Cmd' : 'Ctrl';
}
