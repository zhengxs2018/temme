import { expect, test } from 'vitest';

import { type Ast, DEFAULT_PROCEDURE_NAME, parse } from '../../src/ast';

test('parse default procedure', () => {
  const actual = parse(`div{ $foo };`);
  const expected: Ast.Selector[] = [
    {
      type: 'normal-selector',
      sections: [{ combinator: ' ', element: 'div', qualifiers: [] }],
      procedure: {
        name: DEFAULT_PROCEDURE_NAME,
        args: [{ name: 'foo', filters: [], modifier: null }],
      },
      arrayCapture: null,
      children: [],
    },
  ];

  expect(actual).toEqual(expected);
});

test('parse procedure', () => {
  const actual = parse(`div{ fn($c, 100) }`);

  const expected: Ast.Selector[] = [
    {
      type: 'normal-selector',
      sections: [{ combinator: ' ', element: 'div', qualifiers: [] }],
      procedure: {
        name: 'fn',
        args: [{ name: 'c', filters: [], modifier: null }, 100],
      },
      arrayCapture: null,
      children: [],
    },
  ];

  expect(actual).toEqual(expected);
});
