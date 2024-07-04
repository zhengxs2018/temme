import { t } from '../l10n';
import { type Ast, parse } from '../ast';

export function tokenize(source: string) {
  const selectors = parse(source);

  if (process.env.NODE_ENV === 'development') {
    if (selectors.length === 0) {
      console.warn(t('No selectors found.'));
    }
  }

  return selectors;
}

export function strict_tokenize(source: string): Ast.Selector[] {
  const selectors = tokenize(source);

  for (const selector of selectors) {
    validate(selector);
  }

  return selectors;
}

export function validate(selector: Ast.Selector) {
  if (selector.type === 'parent-ref-selector') {
    throw new SyntaxError(t('Parent-reference selector can only be used at top level.'));
  }

  if (selector.type === 'snippet-define') {
    for (const child of selector.selectors) {
      validate_child_selector(child);
    }
    return;
  }

  if (selector.type === 'normal-selector') {
    validate_normal_selector(selector);

    for (const child of selector.children) {
      validate_child_selector(child);
    }
  }
}

function validate_child_selector(selector: Ast.Selector) {
  if (selector.type === 'snippet-define') {
    throw new SyntaxError(t('The definition of snippet "%s" must be at top level.', selector.name));
  }

  if (selector.type === 'filter-define') {
    throw new SyntaxError(t('The definition of inline filter "%s" must be at top level.', selector.name));
  }

  if (selector.type === 'normal-selector') {
    validate_normal_selector(selector);

    for (const child of selector.children) {
      validate_child_selector(child);
    }
  }
}

function validate_normal_selector(selector: Ast.NormalSelector) {
  const sectionCount = selector.sections.length;
  const leadingSections = selector.sections.slice(0, sectionCount - 1);
  const hasLeadingCapture = contains_any_capture(leadingSections);

  if (hasLeadingCapture) {
    throw new SyntaxError(t('Leading attribute capture is not allowed.'));
  }
}

function contains_any_capture(sections: Ast.Section[]) {
  return sections.some(section => section.qualifiers.some(is_capture_qualifier));
}

function is_capture_qualifier(qualifier: Ast.Qualifier) {
  return qualifier.type === 'attribute-qualifier' && qualifier.value && typeof qualifier.value === 'object';
}
