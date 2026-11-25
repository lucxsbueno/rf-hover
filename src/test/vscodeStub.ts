// Minimal stub of the 'vscode' module, to test the hover outside VS Code.
// Covers only what the extension uses in these tests.

export const stubState = {
  language: 'en',
  config: {} as Record<string, unknown>,
};

class EventEmitter<T> {
  private listeners: Array<(e: T) => void> = [];

  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return { dispose() {} };
  };

  fire(e: T): void {
    for (const listener of this.listeners) {
      listener(e);
    }
  }

  dispose(): void {
    this.listeners = [];
  }
}

class Uri {
  readonly fsPath: string;

  constructor(private readonly value: string) {
    this.fsPath = value.replace('file://', '');
  }

  static parse(value: string): Uri {
    return new Uri(value);
  }

  toString(): string {
    return this.value;
  }
}

class MarkdownString {
  value = '';
  isTrusted: unknown;

  appendMarkdown(text: string): this {
    this.value += text;
    return this;
  }

  appendText(text: string): this {
    this.value += text;
    return this;
  }
}

class Position {
  constructor(public line: number, public character: number) {}
}

class Range {
  constructor(
    public startLine: number,
    public startCharacter: number,
    public endLine: number,
    public endCharacter: number
  ) {}
}

class Hover {
  constructor(public contents: unknown, public range?: unknown) {}
}

const vscodeStub = {
  EventEmitter,
  Uri,
  MarkdownString,
  Position,
  Range,
  Hover,
  env: {
    get language() {
      return stubState.language;
    },
  },
  workspace: {
    getConfiguration: (section: string) => ({
      get: (key: string, fallback?: unknown) => {
        const value = stubState.config[`${section}.${key}`];
        return value === undefined ? fallback : value;
      },
    }),
    asRelativePath: (uri: Uri) => uri.fsPath.replace('/ws/', ''),
  },
};

const VSCODE_ID = '/__vscode_stub__';
let installed = false;

/** Makes require('vscode') return the stub. Must be called before importing the extension modules. */
export function installVscodeStub(): void {
  if (installed) {
    return;
  }
  installed = true;

  const Module = require('module');
  const originalResolve = Module._resolveFilename;
  Module._resolveFilename = function (request: string, ...rest: unknown[]) {
    if (request === 'vscode') {
      return VSCODE_ID;
    }
    return originalResolve.call(this, request, ...rest);
  };

  require.cache[VSCODE_ID] = {
    id: VSCODE_ID,
    filename: VSCODE_ID,
    loaded: true,
    exports: vscodeStub,
  } as unknown as NodeModule;
}
