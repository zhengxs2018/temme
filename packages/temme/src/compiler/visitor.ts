import { type Ast } from '../ast';
import { t } from '../l10n';

export type RefNode = Ast.ParentRefSelector;
export type NormalNode = Ast.NormalSelector;
export type AssignmentNode = Ast.Assignment;
export type FilterNode = Ast.FilterDefine;
export type ModifierNode = Ast.ModifierDefine;
export type ProcedureNode = Ast.ProcedureDefine;

export type Node = RefNode | NormalNode | AssignmentNode | FilterNode | ModifierNode | ProcedureNode;

export interface Visitor {
  visit(node: Node): void;
}

export function visit(selectors: Ast.Selector[], visitor: Visitor) {
  const unique = new Set<string>();
  const snippets = new Map<string, Ast.SnippetDefine>();

  function collect_snippet(descriptor: Ast.SnippetDefine) {
    const { name } = descriptor;

    if (process.env.NODE_ENV === 'development') {
      if (snippets.has(name)) {
        throw new SyntaxError(t('Snippet "%s" is already defined.', name));
      }
    }

    snippets.set(name, descriptor);
  }

  function traverse(selectors: Ast.Selector[]) {
    const expand: string[] = [];

    for (const selector of selectors) {
      switch (selector.type) {
        case 'filter-define':
        case 'modifier-define':
        case 'procedure-define':
        case 'parent-ref-selector':
        case 'normal-selector':
        case 'assignment':
          visitor.visit(selector);
          break;
        case 'snippet-define':
          collect_snippet(selector);
          break;
        case 'snippet-expand': {
          const name = selector.name;
          if (unique.has(selector.name)) {
            throw new SyntaxError(t('Circular snippet expansion detected: %s -> [%s]', name, unique.toString()));
          }

          expand.push(name);
          break;
        }
      }
    }

    if (expand.length === 0) return;

    traverse(
      expand.reduce((selectors, name) => {
        const snippet = snippets.get(name);

        if (snippet) {
          return selectors.concat(snippet.selectors);
        }

        throw new SyntaxError(t('Snippet "%s" is not defined.', name));
      }, [] as Ast.Selector[]),
    );
  }

  traverse(selectors);
}
