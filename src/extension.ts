import * as vscode from 'vscode';
import { getPrefixes } from './config';
import { createDefinitionProvider } from './definition';
import { registerDecorations } from './decorations';
import { GO_TO_DEFINITION_COMMAND, createHoverProvider } from './hover';
import { RequirementIndex } from './requirementIndex';
import { indexWorkspace, registerWatchers } from './watcher';

export function activate(context: vscode.ExtensionContext): void {
  const index = new RequirementIndex(getPrefixes());

  context.subscriptions.push(
    index,
    vscode.languages.registerHoverProvider({ scheme: 'file' }, createHoverProvider(index)),
    vscode.languages.registerDefinitionProvider({ scheme: 'file' }, createDefinitionProvider(index)),
    // Used by the "Go to definition" link in the hover.
    vscode.commands.registerCommand(
      GO_TO_DEFINITION_COMMAND,
      async (uriString: string, line: number) => {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uriString));
        const safeLine = Math.min(Math.max(line, 0), document.lineCount - 1);
        const range = document.lineAt(safeLine).range;
        const editor = await vscode.window.showTextDocument(document, { selection: range });
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      }
    ),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('rfHover.prefixes') || event.affectsConfiguration('rfHover.disabledPrefixes')) {
        index.reset(getPrefixes());
        void indexWorkspace(index);
      }
    })
  );

  registerWatchers(context, index);
  registerDecorations(context, index);
  void indexWorkspace(index);
}

export function deactivate(): void {}
