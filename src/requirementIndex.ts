import * as vscode from 'vscode';
import { buildRegexes, parseDefinitions, Regexes } from './requirements';

export interface Requirement {
  key: string;
  text: string;
  /** URI of the file holding the definition (toString()). */
  uri: string;
  /** Definition line, 0-based. */
  line: number;
}

/**
 * In-memory map of every requirement definition in the workspace.
 * The same ID can be defined in more than one file; every occurrence is kept.
 */
export class RequirementIndex implements vscode.Disposable {
  private regexes: Regexes;
  private readonly byKey = new Map<string, Requirement[]>();
  private readonly byUri = new Map<string, Requirement[]>();
  private readonly emitter = new vscode.EventEmitter<void>();

  readonly onDidChange = this.emitter.event;

  constructor(prefixes: string[]) {
    this.regexes = buildRegexes(prefixes);
  }

  get referenceRegex(): RegExp {
    return this.regexes.reference;
  }

  /** Changes the recognized prefixes and clears the index (the workspace must be reindexed afterwards). */
  reset(prefixes: string[]): void {
    this.regexes = buildRegexes(prefixes);
    this.byKey.clear();
    this.byUri.clear();
    this.emitter.fire();
  }

  /** Replaces the definitions of a file with the ones found in the given text. */
  updateFile(uri: string, text: string): void {
    this.removeEntries(uri);
    const parsed = parseDefinitions(text, this.regexes.definition);
    if (parsed.length > 0) {
      const requirements = parsed.map((def) => ({ ...def, uri }));
      this.byUri.set(uri, requirements);
      for (const req of requirements) {
        const list = this.byKey.get(req.key);
        if (list) {
          list.push(req);
        } else {
          this.byKey.set(req.key, [req]);
        }
      }
    }
    this.emitter.fire();
  }

  removeFile(uri: string): void {
    if (this.removeEntries(uri)) {
      this.emitter.fire();
    }
  }

  lookup(key: string): Requirement[] {
    return this.byKey.get(key) ?? [];
  }

  has(key: string): boolean {
    return this.byKey.has(key);
  }

  dispose(): void {
    this.emitter.dispose();
  }

  private removeEntries(uri: string): boolean {
    const previous = this.byUri.get(uri);
    if (!previous) {
      return false;
    }
    for (const req of previous) {
      const list = this.byKey.get(req.key);
      if (!list) {
        continue;
      }
      const remaining = list.filter((item) => item !== req);
      if (remaining.length > 0) {
        this.byKey.set(req.key, remaining);
      } else {
        this.byKey.delete(req.key);
      }
    }
    this.byUri.delete(uri);
    return true;
  }
}
