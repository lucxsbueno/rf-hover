import * as vscode from 'vscode';
import { findReferences } from './requirements';
import { RequirementIndex } from './requirementIndex';

const REFRESH_DEBOUNCE_MS = 150;

/**
 * Underlines references to requirements defined in the workspace.
 * References without a definition are not highlighted.
 */
export function registerDecorations(context: vscode.ExtensionContext, index: RequirementIndex): void {
  const decorationType = vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline',
    color: new vscode.ThemeColor('editorLink.activeForeground'),
  });

  let timer: ReturnType<typeof setTimeout> | undefined;

  const applyTo = (editor: vscode.TextEditor) => {
    const document = editor.document;
    if (document.uri.scheme !== 'file') {
      editor.setDecorations(decorationType, []);
      return;
    }

    const ranges: vscode.Range[] = [];
    for (let line = 0; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      for (const ref of findReferences(lineText, index.referenceRegex)) {
        if (index.has(ref.key)) {
          ranges.push(new vscode.Range(line, ref.start, line, ref.end));
        }
      }
    }
    editor.setDecorations(decorationType, ranges);
  };

  const refreshVisible = () => {
    for (const editor of vscode.window.visibleTextEditors) {
      applyTo(editor);
    }
  };

  const schedule = () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      refreshVisible();
    }, REFRESH_DEBOUNCE_MS);
  };

  context.subscriptions.push(
    decorationType,
    index.onDidChange(schedule),
    vscode.window.onDidChangeActiveTextEditor(schedule),
    vscode.window.onDidChangeVisibleTextEditors(schedule),
    vscode.workspace.onDidChangeTextDocument(schedule),
    {
      dispose: () => {
        if (timer) {
          clearTimeout(timer);
        }
      },
    }
  );

  schedule();
}
