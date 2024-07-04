import { expect, test } from 'vitest';

import { type Ast, parse } from '../../src/ast';

test('snippet define', () => {
  const selector = `
      @snippet = {
        $foo = 'bar';
      };
    `;
  const expectedResult: Ast.Selector[] = [
    {
      type: 'snippet-define',
      name: 'snippet',
      selectors: [
        {
          type: 'assignment',
          capture: { name: 'foo', filters: [], modifier: null },
          value: 'bar',
        },
      ],
    },
  ];
  expect(parse(selector)).toEqual(expectedResult);
});

test('snippet expand', () => {
  const selector = `@snippet;`;
  const expectedResult: Ast.Selector[] = [
    {
      type: 'snippet-expand',
      name: 'snippet',
    },
  ];
  expect(parse(selector)).toEqual(expectedResult);
});
