import { type Ast } from '../ast';
import { strict_tokenize } from './tokenizer';
import { visit } from './visitor';

interface SelectorTokenBase {
  type: 'normal-selector' | 'parent-ref-selector';
  selector: string;
  procedure: Ast.Procedure;
  sections: Ast.Section[];
  children?: Token[];
  arrayCapture?: Ast.NormalSelector['arrayCapture'];
}

export interface Selector extends SelectorTokenBase {
  type: 'normal-selector';
  children: Token[];
  arrayCapture: Ast.NormalSelector['arrayCapture'];
}

export interface Ref extends SelectorTokenBase {
  type: 'parent-ref-selector';
}

export type Assignment = Ast.Assignment;

export type Token = Assignment | Selector | Ref;

export function compile(source: string): Token[] {
  return traverse(strict_tokenize(source));
}

export function is_capture(value: any): value is Ast.Capture {
  return typeof value === 'object' && typeof value.name === 'string' && Array.isArray(value.filters);
}

export function is_attribute_qualifier(qualifier: Ast.Qualifier): qualifier is Ast.AttributeQualifier {
  return qualifier.type === 'attribute-qualifier';
}

export function traverse(selectors: Ast.Selector[]) {
  const tokens: Token[] = [];

  visit(selectors, {
    visit(node) {
      to_token(node, tokens);
    },
  });

  return tokens;
}

function to_token(node: Ast.Selector, tokens: Token[]) {
  if (node.type === 'assignment') {
    tokens.push(node);
    return;
  }

  if (node.type === 'parent-ref-selector') {
    return {
      type: node.type,
      procedure: node.procedure,
      selector: stringify(node),
      sections: [node.section],
    };
  }

  if (node.type === 'normal-selector') {
    const children: Token[] = [];

    node.children.forEach(s => to_token(s, children));

    tokens.push({
      type: node.type,
      procedure: node.procedure,
      children: children,
      arrayCapture: node.arrayCapture,
      selector: stringify(node),
      sections: node.sections,
    });
    return;
  }
}

function stringify(selector: Ast.NormalSelector | Ast.ParentRefSelector): string {
  if (selector.type === 'parent-ref-selector') {
    return to_css_selector(selector.section);
  }

  return to_css_selectors(selector.sections);
}

function to_css_selectors(sections: Ast.Section[]): string {
  return sections.map(to_css_selector).join('');
}

/** Generator standard css selector according to temme sections. */
function to_css_selector(section: Ast.Section): string {
  const result: string[] = [];

  result.push(section.combinator);
  result.push(section.element);

  for (const qualifier of section.qualifiers) {
    switch (qualifier.type) {
      case 'id-qualifier':
        result.push(`#${qualifier.id}`);
        break;
      case 'class-qualifier':
        result.push(`.${qualifier.className}`);
        break;
      case 'attribute-qualifier': {
        const { attribute, operator, value } = qualifier;

        // existence
        if (value == null) {
          result.push(`[${attribute}]`);
          break;
        }

        // Here we does not handle captures, but simply check if the operator is `=`
        if (is_capture(value)) {
          // TODO
          // if (operator === '=') {
          //   throw new SyntaxError(t('Value capture in attribute qualifier only works with "=? operator.'));
          // }
          break;
        }

        // Normal css attribute qualifier
        result.push(`[${attribute}${operator}"${value}"]`);

        break;
      }
      case 'pseudo-qualifier': {
        const { name, content } = qualifier;
        if (content) {
          result.push(`:${name}(${content})`);
        } else {
          result.push(`:${name}`);
        }
        break;
      }
    }
  }

  return result.join('').trim();
}
