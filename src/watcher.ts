import * as vscode from 'vscode';
import { RequirementIndex } from './requirementIndex';

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const EXCLUDE_GLOB = '{**/node_modules/**,**/.git/**}';
const IGNORED_PATH = /[\\/](node_modules|\.git)[\\/]/;
const DOCUMENT_DEBOUNCE_MS = 300;
const BATCH_SIZE = 50;

function isIgnored(uri: vscode.Uri): boolean {
  return uri.scheme !== 'file' || IGNORED_PATH.test(uri.fsPath);
}

/** Reads the file text from disk. Returns undefined for binaries, large files or errors. */
async function readFromDisk(uri: vscode.Uri): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    if (bytes.byteLength > MAX_FILE_BYTES || bytes.includes(0)) {
      return undefined;
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return undefined;
  }
}

/** Prefers the editor content (which may be unsaved) when the file is open. */
function openDocumentText(uri: vscode.Uri): string | undefined {
  const key = uri.toString();
  const doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === key);
  return doc ? doc.getText() : undefined;
}

async function currentText(uri: vscode.Uri): Promise<string | undefined> {
  return openDocumentText(uri) ?? (await readFromDisk(uri));
}

/** Initial scan of the whole workspace. */
export async function indexWorkspace(index: RequirementIndex): Promise<void> {
  const uris = await vscode.workspace.findFiles('**/*', EXCLUDE_GLOB);
  for (let i = 0; i < uris.length; i += BATCH_SIZE) {
    const batch = uris.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (uri) => {
        if (isIgnored(uri)) {
          return;
        }
        const text = await currentText(uri);
        if (text !== undefined) {
          index.updateFile(uri.toString(), text);
        }
      })
    );
  }
}

/** Keeps the index up to date as files are created, changed, deleted or edited. */
export function registerWatchers(context: vscode.ExtensionContext, index: RequirementIndex): void {
  const watcher = vscode.workspace.createFileSystemWatcher('**/*');

  const onDiskChange = async (uri: vscode.Uri) => {
    if (isIgnored(uri)) {
      return;
    }
    const text = await currentText(uri);
    if (text === undefined) {
      index.removeFile(uri.toString());
    } else {
      index.updateFile(uri.toString(), text);
    }
  };

  watcher.onDidCreate(onDiskChange);
  watcher.onDidChange(onDiskChange);
  watcher.onDidDelete((uri) => index.removeFile(uri.toString()));

  // Unsaved edits: reindex with a debounce from the editor text.
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const documentListener = vscode.workspace.onDidChangeTextDocument((event) => {
    const doc = event.document;
    if (isIgnored(doc.uri)) {
      return;
    }
    const key = doc.uri.toString();
    const pending = timers.get(key);
    if (pending) {
      clearTimeout(pending);
    }
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        index.updateFile(key, doc.getText());
      }, DOCUMENT_DEBOUNCE_MS)
    );
  });

  context.subscriptions.push(
    watcher,
    documentListener,
    {
      dispose: () => {
        for (const timer of timers.values()) {
          clearTimeout(timer);
        }
        timers.clear();
      },
    }
  );
}
