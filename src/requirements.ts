// Pure logic (no vscode dependency) for recognizing requirement definitions and references.

export const DEFAULT_PREFIXES = ['RF', 'RN', 'RNF', 'FR', 'NFR', 'UC', 'US', 'BR'];

const PREFIX_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

export interface Regexes {
  /** Matches a full definition on one line: `PREFIX-number: text`. Groups: 1 prefix, 2 number, 3 text. */
  definition: RegExp;
  /** Matches each `PREFIX-number` reference in text. Always global. Groups: 1 prefix, 2 number. */
  reference: RegExp;
}

export interface ParsedDefinition {
  /** Normalized key, e.g. `RF-1` for `RF-01`. */
  key: string;
  text: string;
  /** Definition line, 0-based. */
  line: number;
}

export interface ReferenceMatch {
  key: string;
  /** Coluna inicial (inclusive). */
  start: number;
  /** Coluna final (exclusiva). */
  end: number;
}

/** Keeps only valid entries (text starting with a letter), without duplicates. */
export function sanitizePrefixList(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
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
  return [...result];
}

/**
 * Effective prefixes: the defaults, plus the user's extras, minus the disabled ones.
 * Setting rfHover.prefixes only adds; to drop a default, use rfHover.disabledPrefixes.
 */
export function resolvePrefixes(extra: unknown, disabled: unknown): string[] {
  const disabledSet = new Set(sanitizePrefixList(disabled));
  const merged = new Set([...DEFAULT_PREFIXES, ...sanitizePrefixList(extra)]);
  return [...merged].filter((prefix) => !disabledSet.has(prefix));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildRegexes(prefixes: string[]): Regexes {
  if (prefixes.length === 0) {
    // With no active prefixes there is nothing to recognize.
    return { definition: /(?!)/, reference: /(?!)/g };
  }
  // Longer prefixes first, so RNF is not mistaken for RN.
  const alternation = [...prefixes]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');

  return {
    // Accepts list or markdown markers before the prefix: "- RF-01: text", "> RF-01: text".
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
