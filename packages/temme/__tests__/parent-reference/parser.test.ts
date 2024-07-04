import { expect, test } from 'vitest';

import { type Ast, DEFAULT_CAPTURE_KEY, DEFAULT_PROCEDURE_NAME } from '../../src/ast';
import { parse } from 'path';

test('test parent-reference', () => {
  const expected: Ast.Selector[] = [
    {
      type: 'normal-selector',
      arrayCapture: { filters: [], name: DEFAULT_CAPTURE_KEY, modifier: null },
      sections: [{ combinator: ' ', element: 'div', qualifiers: [] }],
      children: [
        {
          type: 'parent-ref-selector',
          section: { combinator: ' ', element: '*', qualifiers: [] },
          procedure: {
            name: DEFAULT_PROCEDURE_NAME,
            args: [{ filters: [], name: 'value', modifier: null }],
          },
        },
      ],
      procedure: null,
    },
  ];

  expect(parse(`div@ { &{$value} };`)).toEqual(expected);
});
