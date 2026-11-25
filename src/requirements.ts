// Logica pura (sem dependencia do vscode) para reconhecer definicoes e referencias de requisitos.

export const DEFAULT_PREFIXES = ['RF', 'RN', 'RNF', 'FR', 'NFR', 'UC', 'US', 'BR'];

const PREFIX_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

export interface Regexes {
  /** Casa uma definicao completa numa linha: `PREFIXO-numero: texto`. Grupos: 1 prefixo, 2 numero, 3 texto. */
  definition: RegExp;
  /** Casa cada referencia `PREFIXO-numero` no texto. Sempre global. Grupos: 1 prefixo, 2 numero. */
  reference: RegExp;
}

export interface ParsedDefinition {
  /** Chave normalizada, ex.: `RF-1` para `RF-01`. */
  key: string;
  text: string;
  /** Linha da definicao, 0-based. */
  line: number;
}

export interface ReferenceMatch {
  key: string;
  /** Coluna inicial (inclusive). */
  start: number;
  /** Coluna final (exclusiva). */
  end: number;
}

export function sanitizePrefixes(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [...DEFAULT_PREFIXES];
  }
  const result = new Set<string>();
  for (const item of input) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (PREFIX_PATTERN.test(trimmed)) {
        result.add(trimmed);
      }
    }
  }
  return result.size > 0 ? [...result] : [...DEFAULT_PREFIXES];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildRegexes(prefixes: string[]): Regexes {
  // Prefixos mais longos primeiro, para que RNF nao seja confundido com RN.
  const alternation = [...prefixes]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');

  return {
    // Aceita marcadores de lista/markdown antes do prefixo: "- RF-01: texto", "> RF-01: texto".
    definition: new RegExp(`^\\s*(?:[-*+>#]+\\s*)?(${alternation})-(\\d+)\\s*:\\s*(.+?)\\s*$`),
    reference: new RegExp(`\\b(${alternation})-(\\d+)\\b`, 'g'),
  };
}

export function normalizeKey(prefix: string, number: string): string {
  return `${prefix}-${parseInt(number, 10)}`;
}

export function parseDefinitions(text: string, definition: RegExp): ParsedDefinition[] {
  const result: ParsedDefinition[] = [];
  const lines = text.split(/\r?\n/);
  for (let line = 0; line < lines.length; line++) {
    const match = definition.exec(lines[line]);
    if (match) {
      result.push({
        key: normalizeKey(match[1], match[2]),
        text: match[3],
        line,
      });
    }
  }
  return result;
}

export function findReferences(lineText: string, reference: RegExp): ReferenceMatch[] {
  const result: ReferenceMatch[] = [];
  for (const match of lineText.matchAll(reference)) {
    const start = match.index ?? 0;
    result.push({
      key: normalizeKey(match[1], match[2]),
      start,
      end: start + match[0].length,
    });
  }
  return result;
}

export function referenceAt(
  lineText: string,
  character: number,
  reference: RegExp
): ReferenceMatch | undefined {
  return findReferences(lineText, reference).find(
    (ref) => character >= ref.start && character < ref.end
  );
}
