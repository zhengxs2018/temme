import { expect, test } from 'vitest';

import { type Ast, parse } from '../../src';

function extractModifier(selectors: Ast.Selector[]) {
  return ((selectors[0] as Ast.NormalSelector).procedure?.args[0] as Ast.Capture).modifier;
}

test('parse modifiers', () => {
  expect(extractModifier(parse('html{$foo}'))).toEqual(null);
  expect(extractModifier(parse('html{$foo!mod}'))).toEqual({ name: 'mod', args: [] });
  expect(extractModifier(parse('html{$foo|bar!mod}'))).toEqual({
    name: 'mod',
    args: [],
  });
  expect(extractModifier(parse('html{$foo!mod(1, "str")}'))).toEqual({
    name: 'mod',
    args: [1, 'str'],
  });
});
