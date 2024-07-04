import { expect, test } from 'vitest';

import { type Ast, parse } from '../../src';

function extractfilters(selectors: Ast.Selector[]) {
  const selector = selectors[0] as Ast.NormalSelector;
  return (selector.procedure?.args?.[0] as Ast.Capture).filters;
}

test('parse filters', () => {
  expect(extractfilters(parse('html{$h|f}'))).toEqual([{ isArrayFilter: false, name: 'f', args: [] }]);

  expect(extractfilters(parse(`html{$h|f(1,null,'3')|g()|h(false,true,'234')}`))).toEqual([
    { isArrayFilter: false, name: 'f', args: [1, null, '3'] },
    { isArrayFilter: false, name: 'g', args: [] },
    { isArrayFilter: false, name: 'h', args: [false, true, '234'] },
  ]);
});
