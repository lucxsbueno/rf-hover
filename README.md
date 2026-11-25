# Requirement Hover

## Autor

Feito por **Lucas Bueno**.

- Instagram: [@__lucasbueno](https://instagram.com/__lucasbueno)
- GitHub: [github.com/lucxsbueno](https://github.com/lucxsbueno)
- LinkedIn: [linkedin.com/in/lucxsbueno](https://www.linkedin.com/in/lucxsbueno/)
- Repositório e issues: [github.com/lucxsbueno/rf-hover](https://github.com/lucxsbueno/rf-hover)
- Apoie o projeto: [GitHub Sponsors](https://github.com/sponsors/lucxsbueno)

Hover, highlight and go to requirement definitions (RF, RN, RNF, ...) across your workspace, like function references in code.

## Como definir um requisito

Cada requisito é definido em **uma única linha**, no formato:

```
RF-01: o sistema deve permitir login com e-mail e senha
```

Regras:

- A definição fica em **uma linha física, sem quebra de linha**. Não há limite de tamanho: o texto é a linha inteira depois do `PREFIXO-número:`, e o hover mostra o texto completo.
- Podem estar em **qualquer arquivo** do workspace (a varredura começa na raiz do projeto), por exemplo `requisitos.md`, `docs/rf.md` ou um comentário num arquivo de código.
- Marcadores de lista ou markdown antes do prefixo são aceitos: `- RF-01: ...`, `> RF-01: ...`, `## RF-01: ...`.
- `RF-1` e `RF-01` são tratados como o mesmo requisito.

Qualquer ocorrência de `PREFIXO-número` em outro lugar do texto (por exemplo, "conforme dito no RF-01 e RF-02") é uma **referência**: fica sublinhada se o requisito estiver definido no workspace, e ao passar o mouse mostra o texto da definição.

## Prefixos suportados

Padrão:

| Prefixo | Significado usual |
| --- | --- |
| `RF` | Requisito funcional |
| `RN` | Requisito não funcional |
| `RNF` | Requisito não funcional (variante comum) |
| `FR` / `NFR` | Functional / Non-functional Requirement |
| `UC` | Caso de uso |
| `US` | User story |
| `BR` | Regra de negócio |

Para usar outra lista, edite a configuração `rfHover.prefixes` (em `settings.json`):

```json
"rfHover.prefixes": ["RF", "RN", "RNF"]
```

Cada prefixo deve começar com letra e conter apenas letras, números ou `_`. Entradas inválidas são ignoradas. Se houver conflito entre convenções (por exemplo, `RN` como "regra de negócio" em outro projeto), basta ajustar a lista.

## Recursos

- **Hover:** passe o mouse sobre uma referência para ver o texto do requisito, um link **Go to definition** (ou **Ir para a definição**) e o arquivo/linha de origem. Se o ID estiver definido em mais de um arquivo, cada definição tem o seu link.
- **Dica de atalho:** no fim do hover aparece a dica com o atalho do seu sistema, por exemplo `Tip: Cmd+click the ID to do the same.` (no macOS) ou `Ctrl+click` (Windows e Linux).
- **Destaque:** referências a requisitos definidos são sublinhadas.
- **Ir para definição:** Ctrl+clique (Cmd+clique no macOS) numa referência leva à linha da definição. O link do hover faz o mesmo.
- **Atualização em tempo real:** o índice acompanha arquivos criados, alterados e apagados, inclusive edições ainda não salvas.

Arquivos `node_modules`, `.git`, binários e arquivos maiores que 2 MB são ignorados.

## Idioma

A configuração `rfHover.language` controla o idioma do link e da dica:

- `auto` (padrão): segue o idioma de exibição do editor. Se começar com `pt`, usa português; caso contrário, inglês.
- `en`: inglês.
- `pt-br`: português.

Atalho do sistema: o hover usa `Cmd` no macOS e `Ctrl` nos demais. Se você configurou `editor.multiCursorModifier` como `ctrlCmd`, a dica mostra `Alt`, porque nesse caso o "ir para definição" passa a ser Alt+clique.

**Limitação:** em ambientes remotos (SSH, containers, WSL), o sistema detectado é o do servidor, não o da sua máquina. Nesses casos, a dica pode mostrar `Ctrl` no lugar de `Cmd`.

## Instalação local

1. Instale as dependências e gere o build:

   ```sh
   npm install
   npm run compile
   ```

2. Para testar sem instalar, abra a pasta no VS Code ou no Cursor e pressione F5. Uma nova janela (Extension Development Host) carrega a extensão.

3. Para instalar de forma permanente, gere o pacote e instale o `.vsix`:

   ```sh
   npm run package
   code --install-extension requirement-hover-0.1.0.vsix
   ```

   No Cursor, use `cursor --install-extension requirement-hover-0.1.0.vsix` ou o menu "Install from VSIX".

Os testes da lógica de reconhecimento, do idioma e do hover rodam com `npm test`.
