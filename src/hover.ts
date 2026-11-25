import * as vscode from 'vscode';
import { getLanguage, getShortcutModifier } from './config';
import { MESSAGES } from './i18n';
import { referenceAt } from './requirements';
import { RequirementIndex } from './requirementIndex';

export const GO_TO_DEFINITION_COMMAND = 'rfHover.goToDefinition';

/** Link `command:` com argumentos [uri, linha]. Parenteses sao codificados para nao quebrar o markdown. */
function goToDefinitionLink(uri: string, line: number): string {
  const args = encodeURIComponent(JSON.stringify([uri, line]))
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `command:${GO_TO_DEFINITION_COMMAND}?${args}`;
}

function escapeLinkText(text: string): string {
  return text.replace(/[\\[\]]/g, '\\$&');
}

export function createHoverProvider(index: RequirementIndex): vscode.HoverProvider {
  return {
    provideHover(document, position) {
      const lineText = document.lineAt(position.line).text;
      const ref = referenceAt(lineText, position.character, index.referenceRegex);
      if (!ref) {
        return undefined;
      }

      const requirements = index.lookup(ref.key);
      if (requirements.length === 0) {
        return undefined;
      }

      const messages = MESSAGES[getLanguage()];
      const markdown = new vscode.MarkdownString();
      markdown.isTrusted = { enabledCommands: [GO_TO_DEFINITION_COMMAND] };

      requirements.forEach((req, i) => {
        if (i > 0) {
          markdown.appendMarkdown('\n\n---\n\n');
        }
        const relativePath = vscode.workspace.asRelativePath(vscode.Uri.parse(req.uri));
        markdown.appendMarkdown(`**${ref.key}**: `);
        markdown.appendText(req.text);
        markdown.appendMarkdown('\n\n');
        markdown.appendMarkdown(
          `[${escapeLinkText(messages.goToDefinition)}](${goToDefinitionLink(req.uri, req.line)})`
        );
        markdown.appendMarkdown(' · ');
        markdown.appendText(`${relativePath}:${req.line + 1}`);
      });

      // A dica aparece uma unica vez, no fim.
      markdown.appendMarkdown('\n\n_');
      markdown.appendText(messages.shortcutTip(getShortcutModifier()));
      markdown.appendMarkdown('_');

      const range = new vscode.Range(position.line, ref.start, position.line, ref.end);
      return new vscode.Hover(markdown, range);
    },
  };
}
