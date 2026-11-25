import * as vscode from 'vscode';
import { referenceAt } from './requirements';
import { RequirementIndex } from './requirementIndex';

/** Ctrl+clique numa referencia leva a linha da definicao (pode haver mais de uma). */
export function createDefinitionProvider(index: RequirementIndex): vscode.DefinitionProvider {
  return {
    provideDefinition(document, position) {
      const lineText = document.lineAt(position.line).text;
      const ref = referenceAt(lineText, position.character, index.referenceRegex);
      if (!ref) {
        return undefined;
      }

      return index.lookup(ref.key).map(
        (req) =>
          new vscode.Location(
            vscode.Uri.parse(req.uri),
            new vscode.Position(req.line, 0)
          )
      );
    },
  };
}
