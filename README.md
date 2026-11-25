# Requirement Hover

## Author

Built by **Lucas Bueno**.

- Instagram: [@__lucasbueno](https://instagram.com/__lucasbueno)
- GitHub: [github.com/lucxsbueno](https://github.com/lucxsbueno)
- LinkedIn: [linkedin.com/in/lucxsbueno](https://www.linkedin.com/in/lucxsbueno/)
- Repository and issues: [github.com/lucxsbueno/rf-hover](https://github.com/lucxsbueno/rf-hover)
- Support the project: [GitHub Sponsors](https://github.com/sponsors/lucxsbueno)

Hover, highlight and go to requirement definitions (RF, RN, RNF, ...) across your workspace, like function references in code.

## Defining a requirement

Each requirement is defined on **a single line**, in this format:

```
RF-01: the system must allow login with email and password
```

Rules:

- A definition is **one physical line, with no line break**. There is no length limit: the text is the whole line after `PREFIX-number:`, and the hover shows it in full.
- Definitions can live in **any file** in the workspace (scanning starts at the project root), for example `requirements.md`, `docs/rf.md` or a comment in a source file.
- List or markdown markers before the prefix are accepted: `- RF-01: ...`, `> RF-01: ...`, `## RF-01: ...`.
- `RF-1` and `RF-01` are treated as the same requirement.

Any occurrence of `PREFIX-number` elsewhere in the text (for example, "as stated in RF-01 and RF-02") is a **reference**: it is underlined when the requirement is defined somewhere in the workspace, and hovering it shows the definition text.

## Supported prefixes

Defaults:

| Prefix | Usual meaning |
| --- | --- |
| `RF` | Functional requirement |
| `RN` | Non-functional requirement |
| `RNF` | Non-functional requirement (common variant) |
| `FR` / `NFR` | Functional / Non-functional Requirement |
| `UC` | Use case |
| `US` | User story |
| `BR` | Business rule |

Configuration is **additive**: the defaults stay active, and you only add or turn off what you need.

- `rfHover.prefixes`: **extra** prefixes, added on top of the defaults. Example: `["REQ"]` recognizes `REQ-01` without turning off `RF`, `FR`, `BR` and the rest.
- `rfHover.disabledPrefixes`: defaults you want to **turn off**. Example: `["BR", "US"]` stops recognizing `BR-01` and `US-01`.

```json
"rfHover.prefixes": ["REQ"],
"rfHover.disabledPrefixes": ["BR", "US"]
```

Each prefix must start with a letter and contain only letters, numbers or `_`. Invalid entries are ignored. If a prefix appears in both lists, it stays off.

## Features

- **Hover:** hover a reference to see the requirement text, a **Go to definition** link (or **Ir para a definição** in Portuguese) and the source file and line. If the ID is defined in more than one file, each definition gets its own link.
- **Shortcut tip:** the hover ends with a tip for your system, for example `Tip: Cmd+click the ID to do the same.` on macOS or `Ctrl+click` on Windows and Linux.
- **Highlight:** references to defined requirements are underlined.
- **Go to definition:** Ctrl+click (Cmd+click on macOS) a reference to jump to the definition line. The hover link does the same.
- **Live updates:** the index follows files as they are created, changed and deleted, including unsaved edits.

`node_modules`, `.git`, binary files and files larger than 2 MB are skipped.

## Language

The `rfHover.language` setting controls the language of the link and the tip:

- `auto` (default): follows the editor display language. If it starts with `pt`, Portuguese is used; otherwise English.
- `en`: English.
- `pt-br`: Portuguese.

System shortcut: the hover uses `Cmd` on macOS and `Ctrl` elsewhere. If you set `editor.multiCursorModifier` to `ctrlCmd`, the tip shows `Alt`, because "go to definition" then becomes Alt+click.

**Limitation:** in remote environments (SSH, containers, WSL), the detected system is the server's, not your machine's. In those cases the tip may show `Ctrl` instead of `Cmd`.

## Local installation

1. Install the dependencies and build:

   ```sh
   npm install
   npm run compile
   ```

2. To try it without installing, open this folder in VS Code or Cursor and press F5. A new window (Extension Development Host) loads the extension.

3. To install it permanently, build the package and install the `.vsix`:

   ```sh
   npm run package
   code --install-extension requirement-hover-0.1.0.vsix
   ```

   On Cursor, use `cursor --install-extension requirement-hover-0.1.0.vsix` or the "Install from VSIX" menu.

The tests for recognition, language and hover run with `npm test`.
