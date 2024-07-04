import { expect, test } from 'vitest';

import { parse, type Ast } from '../../src'

test('value-assignment at top-level', () => {
  const expected: Ast.Selector[] = [
    {
      type: 'assignment',
      capture: { name: 'a', filters: [], modifier: null },
      value: '123',
    },
  ]
  expect(parse(`$a="123";`)).toEqual(expected)
  expect(parse(`$a = '123';`)).toEqual(expected)
  expect(parse(`$a   \t\n= '123';`)).toEqual(expected)
})

test('value-assignment in children basic-selectors', () => {
  const selector = `
      div@list {
        $a = null;
      };
    `
  const expected: Ast.Selector[] = [
    {
      type: 'normal-selector',
      arrayCapture: { name: 'list', filters: [], modifier: null },
      procedure: null,
      sections: [
        {
          combinator: ' ',
          element: 'div',
          qualifiers: [],
        },
      ],
      children: [
        {
          type: 'assignment',
          capture: { name: 'a', filters: [], modifier: null },
          value: null,
        },
      ],
    },
  ]
  expect(parse(selector)).toEqual(expected)
})

test('value-assignment in content', () => {
  const selector = 'div{ assign($foo, true) }'
  const expected: Ast.Selector[] = [
    {
      type: 'normal-selector',
      arrayCapture: null,
      sections: [
        {
          combinator: ' ',
          element: 'div',
          qualifiers: [],
        },
      ],
      procedure: {
        name: 'assign',
        args: [{ name: 'foo', filters: [], modifier: null }, true],
      },
      children: [],
    },
  ]
  expect(parse(selector)).toEqual(expected)
})
