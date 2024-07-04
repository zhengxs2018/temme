import { describe, expect, test } from 'vitest';

import {
  type Ast,
  parse,
  DEFAULT_PROCEDURE_NAME,
  UNIVERSAL_SELECTOR,
} from '../../src/ast';

test('parse empty selector', () => {
  expect(parse('')).toEqual([]);
  expect(parse('   ')).toEqual([]);
  expect(parse('\t\t  \n\n')).toEqual([]);
  expect(parse('// only comments')).toEqual([]);
  expect(parse('/* only comments */')).toEqual([]);
});

describe('parse JavaScript literals', () => {
  function getExpected(value: any) {
    const assignment: Ast.Assignment = {
      type: 'assignment',
      capture: { name: 'value', filters: [], modifier: null },
      value,
    };
    return [assignment];
  }

  test('strings', () => {
    expect(parse(`$value = 'single quote';`)).toEqual(getExpected('single quote'));
    expect(parse(`$value = "double quote";`)).toEqual(getExpected('double quote'));
  });

  test('numbers', () => {
    expect(parse(`$value = 1234;`)).toEqual(getExpected(1234));
    expect(parse(`$value = +123;`)).toEqual(getExpected(+123));
    expect(parse(`$value = 0;`)).toEqual(getExpected(0));
    expect(parse(`$value = -123;`)).toEqual(getExpected(-123));
    expect(parse(`$value = - 123;`)).toEqual(getExpected(-123));
    expect(parse(`$value = 0x1234;`)).toEqual(getExpected(0x1234));
    expect(parse(`$value = 0b1010;`)).toEqual(getExpected(0b1010));
    expect(parse(`$value = -0xabcd;`)).toEqual(getExpected(-0xabcd));
    expect(parse(`$value = +0b1010;`)).toEqual(getExpected(+0b1010));
    expect(parse(`$value = - 0b1111;`)).toEqual(getExpected(-0b1111));
  });

  test('boolean and null', () => {
    expect(parse(`$value = true;`)).toEqual(getExpected(true));
    expect(parse(`$value = false;`)).toEqual(getExpected(false));
    expect(parse(`$value = null;`)).toEqual(getExpected(null));
  });

  test('regular expressions', () => {
    expect(parse(`$value = /simple/;`)).toEqual(getExpected(/simple/));
    expect(parse(`$value = /com[plex]*\\.{3,5}/;`)).toEqual(getExpected(/com[plex]*\.{3,5}/));
    expect(parse(`$value = /co[ple-x2-9-]?.2+x/gi;`)).toEqual(getExpected(/co[ple-x2-9-]?.2+x/gi));
  });
});

test('parse simple selector: `div`', () => {
  const parseResult: Ast.Selector[] = parse('div;');
  const expectedResult: Ast.Selector[] = [
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
      procedure: null,
      children: [],
    },
  ];
  expect(parseResult).toEqual(expectedResult);
});

describe('parse capture', () => {
  test('attribute capture and procedure at top level', () => {
    const selector = `#question-header .question-hyperlink[href=$url]{$title}`;
    const parseResult: Ast.Selector[] = parse(selector);

    const expectedResult: Ast.Selector[] = [
      {
        type: 'normal-selector',
        arrayCapture: null,
        sections: [
          {
            combinator: ' ',
            element: UNIVERSAL_SELECTOR,
            qualifiers: [
              {
                type: 'id-qualifier',
                id: 'question-header',
              },
            ],
          },
          {
            combinator: ' ',
            element: UNIVERSAL_SELECTOR,
            qualifiers: [
              {
                type: 'class-qualifier',
                className: 'question-hyperlink',
              },
              {
                type: 'attribute-qualifier',
                attribute: 'href',
                operator: '=',
                value: { name: 'url', filters: [], modifier: null },
              },
            ],
          },
        ],
        procedure: {
          name: DEFAULT_PROCEDURE_NAME,
          args: [{ name: 'title', filters: [], modifier: null }],
        },
        children: [],
      },
    ];

    expect(parseResult).toEqual(expectedResult);
  });

  test('array capture and procedure in children basic-selectors', () => {
    const selector = `
      div@list {
        .foo{$h|html};
      };
    `;
    const parseResult = parse(selector);

    const expectedResult: Ast.Selector[] = [
      {
        type: 'normal-selector',
        arrayCapture: { name: 'list', filters: [], modifier: null },
        sections: [{ combinator: ' ', element: 'div', qualifiers: [] }],
        procedure: null,
        children: [
          {
            type: 'normal-selector',
            arrayCapture: null,
            sections: [
              {
                combinator: ' ',
                element: UNIVERSAL_SELECTOR,
                qualifiers: [{ type: 'class-qualifier', className: 'foo' }],
              },
            ],
            procedure: {
              name: DEFAULT_PROCEDURE_NAME,
              args: [
                {
                  name: 'h',
                  filters: [{ isArrayFilter: false, name: 'html', args: [] }],
                  modifier: null,
                },
              ],
            },
            children: [],
          },
        ],
      },
    ];

    expect(parseResult).toEqual(expectedResult);
  });

  test('multiple attribute capture in one pair of brackets', () => {
    const selector = 'div[foo=$x bar=$y];';
    const parseResult = parse(selector);
    const expectedResult: Ast.Selector[] = [
      {
        type: 'normal-selector',
        sections: [
          {
            combinator: ' ',
            element: 'div',
            qualifiers: [
              {
                type: 'attribute-qualifier',
                attribute: 'foo',
                operator: '=',
                value: { name: 'x', filters: [], modifier: null },
              },
              {
                type: 'attribute-qualifier',
                attribute: 'bar',
                operator: '=',
                value: { name: 'y', filters: [], modifier: null },
              },
            ],
          },
        ],
        procedure: null,
        arrayCapture: null,
        children: [],
      },
    ];
    expect(parseResult).toEqual(expectedResult);
  });

  test('other different attribute operators', () => {
    const operators: Ast.AttributeOperator[] = ['=', '~=', '|=', '*=', '^=', '$='];
    for (const operator of operators) {
      const selector = `div[foo${operator}$x];`;
      const parseResult = parse(selector);
      const expectedResult: Ast.Selector[] = [
        {
          type: 'normal-selector',
          sections: [
            {
              combinator: ' ',
              element: 'div',
              qualifiers: [
                {
                  type: 'attribute-qualifier',
                  attribute: 'foo',
                  operator,
                  value: { name: 'x', filters: [], modifier: null },
                },
              ],
            },
          ],
          procedure: null,
          arrayCapture: null,
          children: [],
        },
      ];
      expect(parseResult).toEqual(expectedResult);
    }
  });
});

test('using string literal in attribute qualifiers', () => {
  const parseResult = parse(`[foo="a b c"];`);
  const expectedResult: Ast.Selector[] = [
    {
      type: 'normal-selector',
      sections: [
        {
          combinator: ' ',
          element: UNIVERSAL_SELECTOR,
          qualifiers: [
            {
              type: 'attribute-qualifier',
              attribute: 'foo',
              operator: '=',
              value: 'a b c',
            },
          ],
        },
      ],
      procedure: null,
      arrayCapture: null,
      children: [],
    },
  ];
  expect(parseResult).toEqual(expectedResult);

  expect(parse(`[foo='a b c'];`)).toEqual(expectedResult);
});

describe('test different section combinator', () => {
  function getExpectedResult(combinator: Ast.Combinator): Ast.Selector[] {
    return [
      {
        type: 'normal-selector',
        sections: [
          {
            combinator: ' ',
            element: 'div',
            qualifiers: [],
          },
          {
            combinator,
            element: 'div',
            qualifiers: [],
          },
        ],
        procedure: null,
        arrayCapture: null,
        children: [],
      },
    ];
  }

  for (const combinator of [' ', '>', '+', '~'] as Ast.Combinator[]) {
    test(`test ${JSON.stringify(combinator)}`, () => {
      const parseResult = parse(`div ${combinator} div;`);
      expect(parseResult).toEqual(getExpectedResult(combinator));
    });
  }
});

test('test JavaScript comments', () => {
  expect(parse('/* abcdef */')).toEqual([]);
  expect(parse('// abcdef')).toEqual([]);

  const s1 = `
    // single line comment
    /* multi
      line commnet */
      /* pre*/div{$} // after
  `;
  const s2 = 'div{$}';
  expect(parse(s1)).toEqual(parse(s2));

  const s3 = `
    /*111*/div[/*222*/foo=$bar/*333*/]{ //444
    html($foo)}
  `;
  const s4 = 'div[foo=$bar]{html($foo)}';
  expect(parse(s3)).toEqual(parse(s4));
});
