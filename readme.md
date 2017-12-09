[![Build Status](https://img.shields.io/travis/shinima/temme/master.svg)](https://travis-ci.org/shinima/temme) [![Coverage Status](https://img.shields.io/coveralls/shinima/temme/master.svg)](https://coveralls.io/github/shinima/temme?branch=master) [![NPM Package](https://img.shields.io/npm/v/temme.svg)](https://www.npmjs.org/package/temme) [![Greenkeeper badge](https://badges.greenkeeper.io/shinima/temme.svg)](https://greenkeeper.io/)

[中文文档](./readme-zh.md)  [豆瓣爬虫示例](/examples/douban-movie)

# Temme

Temme is a concise and convenient jQuery-like selector to extract JSON from HTML documents. Try temme in [playground](https://temme.js.org).

# Install

`yarn add temme` or `npm install temme`

# Command Line API

```bash
# Command line tool prefers global installation
yarn global add temme

# Basic usage
temme <selector> <html>

# Use html from stdin; --format to format the output
temme <selector> --format

# Use selector from a file
temme <path-to-a-selector-file>

# Pipe html from `curl` to `temme`
curl -s <url> | temme <selector>
```

# Node API

```typescript
// es-module
import temme from 'temme'
// or use require
// const temme = require('temme').default

const html = '<div color="red">hello world</div>'
const temmeSelector = 'div[color=$c]{$t};'
temme(html, temmeSelector)
// => { c: 'red', t: 'hello world' }
```

# Examples

Full examples are avaiable under the [*examples*](/examples) folder. If you are not familiar with temme, you can start with [douban-movie example](/examples/douban-movie) or [github example (coming soon)](/examples/github).

There are several short examples on the playground. [This example][example-github-commits] extracts commits information from GitHub commits page, including time, author, commit message and links. [This example][example-github-issues] extract issues information from GitHub issues page, including title, assignee and number of comments.

# Inspiration

Temme is inspired by [Emmet](https://emmet.io/). Emmet generates HTML according to a css-selector-like template. The behavior of emmet is like the following function:
```JavaScript
emmet('div[class=red]{text content};')
// => <div class="red">text content</div>

// Extend this function to allow a second argument `data`
emmet('div[class=$cls]{$content};', { cls: 'red', content: 'text content' })
// => <div class="red">text content</div>
```

As the name indicates, temme is the reverse of emmet. If we express temme as a function, then it looks like:
```JavaScript
temme('<div class="red">text content</div>', 'div[class=$cls]{$content};')
// => { cls: 'red', content: 'text content' }
```

List the signatures of `emmet` and `temme`, and we get:
* `emmet(selector, data) -> html`
* `temme(html, selector) -> data`

Given a selector, `emmet` expand this selector to HTML using data, while `temme` capture data from HTML according to the selector.

# Match & Capture & Temme-selector

Before extracting JSON from HTML, we need to answer two questions:

1. How to find the nodes that contains the data we want?
2. After finding the nodes, which attributes of the node should be extracted, and which fields should be used to store the extracted data?

The answer to the first question is simple: we use CSS selector. CSS selectors are widely used in various aspects. In web standards, CSS selectors define the elements to which a set of CSS rules apply. JQuery and cheerio uses CSS selectors to select elements/nodes in HTML documents. Puppeteer also uses CSS selectors to select an element in the page. In temme, we use CSS selectors too.

But CSS selectors only contain *match* information and they can only answer the first question. To answer the second question, we need to extend the CSS selectors syntax so that the new syntax (called temme-selector) can contain *capture* information. Capture information is mainly about which items are stored into which fields in result (result is an JavaScript object). Item can be value of attributes, text or html of nodes. Temme-selector `'div[class=$cls]'` captures attribute `class` into `.cls` of the result; Temme-selector `'p{$content}'` captures text content of the p element into field `.content` of the result.

The extended syntax is inspired by several tools. Temme supports JavaScript-style comments, JavaScript literals (string/number/null/boolean/RegExp), assignments, parent-reference as in stylus, and attributes/content capture inspired by Emmet. The grammar and the runninng semantics of the extended syntax are listed below.

# Grammar and Semantics

## Value-Capture `$`

**Syntax:**

* `[foo=$xxx]`  Place in CSS attribute qualifiers to catpure attribute value.
* `{$xxx}`  Place in content part to capture html/text.
* `[foo=$]` / `{$}`:  Omit xxx and make a default-value-capture.

Value-capture is a basic form of capture. Value-capture can be placed in attribute part (in square brackets) to capture attribute value, or in content part (in curly braces) to capture text/html. 

**Running semantics:**

Normal attribute qualifier is like `[foo=bar]`. Attribute-capture is like `[foo=$bar]`, which means put the value of attribute `foo` into `.bar` of the capture result. In emmet, `div{foo}` expands to `<div>foo</div>`; In temme, content caputre `{$buzz}` means capture text of a node into `.buzz` of the capture result.

The output of `temme()` is an object called capture-result. Capture-result contains captured items at specific fields. We can use a single `$` to make a default value-capture, and the capture result will be a single value.

**Example:**

```JavaScript
temme('<div class="red">text content</div>', 'div[class=$cls]{$content};')
// => { cls: 'red', content: 'text content' }

temme('<div class="red">text content</div>', 'div[class=$]')
// => 'red'
```

## Array-capture `@`

**Syntax:**
* `div.foo@xxx { /* children-selectors */ }`  Can only be placed after a normal CSS selector; `@` is the mark of an array-capture; A pair of curly brackets is required after @xxx; Children selectors are put within the curly brackets.
* `div.foo@ { /* children-selectors */ }` Omit xxx and make a default-array-capture.

Array-capture is another form of capture. It is useful when we want to capture an array of similar items. We need place `@xxx` after normal CSS selector (called parent-selector), and define several children selectors within a trailing curly brackets.

**Running Semantics:**

For every node (called parent-node) that matches parent-selector, execute the children selectors one-by-one; every parent-node corresponds an object as result, and the result of array-capture is the array composed of parent-node result. The array itself will be the `.xxx` field of the upper-level result. 

Like default-value-capture, we could just use a single at-sign to make a default array-capture, and the array will be the result of upper-level result.

**Examples:**

```JavaScript
const html = `
<ul>
  <li data-fruit-id="1">
    <span data-color="red">apple</span>
  </li>
  <li data-fruit-id="2">
    <span data-color="white">pear</span>
  </li>
  <li data-fruit-id="3">
    <span data-color="purple">grape</span>
  </li>
</ul>`

temme(html, 'li@fruits { span[data-color=$color]{$name}; }')
// { 
//   "fruits": [
//     { "color": "red", "name": "apple" },
//     { "color": "white", "name": "pear"  },
//     { "color": "purple", "name": "grape" }
//   ]
// }

// Default value capture
temme(html, 'li@ { span[data-color=$color]{$name}; }')
// [
//   { "color": "red", "name": "apple" },
//   { "color": "white", "name": "pear"  },
//   { "color": "purple", "name": "grape" }
// ]
```

## Nested Array-Captures

Array-capture can be nested. Just place a array-capture within another array-capture. [In this StackOverflow example][example-so-all-answers-and-all-comments], one question has several answers and each answer has several comments. We could use the nested array-captures to capture an array of arrays of comments.

## Parent Reference `&`

`&` gives us the ability to capture data in the parent node. It has the same semantic meaning as in sass, less or stylus. Parent-reference is useful in array-capture when the data is stored in the parent node.

**Examples:**

```JavaScript
// html is the same as in array-capture example
temme(html, 'li@ { &[data-fruit-id=$fid]; }')
//=> [ { "fid": "1" }, { "fid": "2" }, { "fid": "3" } ]
```

## Multiple Selectors

Temme supports multiple selectors at top-level and in children selectors. Every selector should end with a semicolon. But if the selector ends with curly brace, then the semicolon is optional.

**Examples:**

```JavaScript
// html is the same as in array-capture example
temme(html, ` [data-color=red]{$name};
              [data-fruit-id="3"] [data-color=$color]; `)
//=> { "name": "apple", "color": "purple" }
```

## Assignments

**Syntax:**
* `$foo = bar;`  foo should be a valid JavaScript identifier; bar should be a JavaScript literal (string/number/null/boolean/RegExp).

**Running Semantics:**

Assignments could appears in three places:

1. At top level: `$foo = 'bar';` means that string `'bar'` will be in `.foo` of the final result;
2. In content-capture: `div.foo{ $a = null }` is like a conditional capture, if there is a div that satisfies `.foo` qualifier, then the assignment is executed;
3. In children selector, `li@list { $x = 123 }` means that every object in `list` will have `123` as the `.x` field.

**Examples:**

```JavaScript
// TODO LAST EDIT HERE
```

## JavaScript Style Comments

Temme selector supports both single line comments `// ......` and multi-line comments `/* ...... */`.

## Capture Filters (post-processors) `|`

### Syntax:
* `$foo|xxx` / `@bar|xxx`:  Place right after a value-capture or array-capture; xxx is the filter functions name and shoule be a valid JavaScript identifier.
* `$foo|xxx(arg1, arg2, ...)`:  Filter can accept arguments. Every argument is a JavaScript literal.
* `$foo|f1(a,b)|f2`: Filters can be chained.

When a value is captured, it is always a string. A filter is a simple function that receive input as `this` with several arguments, and returns a single value. You could use filters to process the captured value. [example][example-filters]

### Running semantics:

* `li.good{$x|foo}`:  Every time `x` is captured, it will be processed as `x = foo.apply(x)`;
* `div.bad{$x|foo(1, false)}`:  Every time variable `x` is captured, it will be processed as `x = foo.apply(x, [1, false])`;
* `div.hello{$x|foo|bar(0, 20)}`:  The value will first be processed by filter `foo` and then by filter `bar`. The value is processed like `x = foo.apply(x); x = bar.apply(x, [0, 20]);`.

### Built-in filters

Temme provides a few filters out of box. Built-in filters could be divided into three categories:
1. Structure Manipulation Filters: this category includes `pack`, `flatten`, `compact`, `first`, `last`, `nth`. These functions are short but powerful. [See source for more detail](/src/filters.ts).
2. Type Coercion Filters: this category includes `String`, `Number`, `Date`, `Boolean`. These filters converts the captured value to specific type.
3. Prototype Filters: We can use methods on prototype chain as filters (This is why the input is supplied as `this`). For example, if we can ensure that `x` is always a string, then we can safely use `$x|substring(0, 20)` or `$x|toUpperCase`.

### Using Customized Filters

Use `defineFilter` to add customized global filters. Or provide a customized filter map as the third parameter of function `temme`.

```JavaScript
import { defineFilter } from 'temme'

// Define a global filter
defineFilter('myFilter', function myFilter(arg1, arg2) { /* ... */ })

// Pass extraFilters as the third argument
const extraFilters = {
  secondItem() {
    return this[1]
  },
  /* put customized filters here */
}
temme(html, 'div@arr|secondItem { p{$text} }', extraFilters)
```

### Inline Filters Definition

Inline filters definition has the same syntax as JavaScript-style function definition. The only difference is that temme use `filter` as the keyword instead of `function`.

```
filter inlineFilter(arg1, arg2, arg3) {
  /* Filter Logic Here. */
  /* The code here will be executed as in a JavaScript function. */
  /* Note that the curly braces must be balanced here. */
}
```

### Array-Filters Syntax `||`

Use array-filter syntax `||`, temme will treat the captured value as an array, and apply the filter to every item of this array.

```JavaScript
temme('<div>1 22 333 4444</div>', `div{ $|split(' ')||Number }`)
// => [1, 22, 333, 4444]
```

## Content

The selectors in the curly brackets after normal CSS selector are called content. Content is used to capture text or html of a node. Content consists of several content-parts, separated by semicolons. Each content-part can be in one of the following forms:  [example][example-content]
1. Capture.  This will capture text/html of the node into the specified field;
2. Assignment.  It is like a conditional assignment, if temme find that a node satisfies the normal CSS selector, then the assignment is executed;
3. Content Function Call **(experimental)**. See below for more detail.

### Capture in Content
`text`, `html`, `outerHTML` and `node` are special filters in content. One of these is always used as the first filter in content capture. If not specified explicitly, `text` will be used. `text` gets the text content of the matching nodes; `html` gets the inner HTML of the matching nodes; `outerHTML` gets the outer HTML of the matching nodes; `node` gets the node itself, which is useful when temme-selector does not meet the requirements and we need to call cheerio APIs manually. [example][example-special-filters-in-content]

### Content Functions (experimental)

Call a content function, passing the capture-result object, the node and the arguments in the parentheses. Content function can do both matching and capturing. See [source](/src/contentFunctions.ts) for more implementation detail. [example][example-content-functions]

Currently, there is only one built-in content function `find`. `find` try to capture a substring of the node text. Examples of `find`:

* `find($x, 'world')` will try to capture the text **before** `'world'`. If the text of node is `'hello world'`, then the result will be `{ x: 'hello' }`
* `find('hello', $x)` will try to capture the text **after** `'hello'`.
* `find('hello', $x, 'world')` will try to capture the text **between** `'hello'` and `'world'`.

`find` simply uses `String#indexOf` to get the index of a substring. If `find` cannot find the substring that should appear before/after the target substring, then it will set the capture-result as *failed*.

### Use Customized Content Functions (experimental)

```JavaScript
import { contentFunctions } from 'temme'

// Get a content function
contentFunctions.get('find')
// Set a customized content function
contentFunctions.set('myContentFn', myContentFn)
// Remove a content function
contentFunctions.remove('uselessContentFn')

function myContentFn(result, node, capture1, string2) {
  /* Your customized logic here */

  // Call CaptureResult#add to add a field of result
  result.add(capture1.name, node.attr('foo'), capture1.filterList)

  // Call CaptureResult#setFailed to set the result to failed state
  result.setFailed()
}
```

Content function is a more powerful way than normal css selector. But in most scenarios, we do not need customized content functions. Temme supports pseudo-selector powered by [css-select](https://github.com/fb55/css-select#supported-selectors). Especially, `:contains`, `:not` and `:has` are useful pseudo-selectors which enhance the select ability a lot. Before using customized content functions, try to test whether pseudo-selectors can satisfy the requirements.

## Snippets (experimental)

Snippet is a way of reusing sub-selectors in a temme-selector. It is useful when the parent-selectors vary but children selectors alike.

### Syntax

* `@xxx = { /* selectors */ };`  Define a snippet named xxx. xxx should be a valid JavaScript identifier.
* `@xxx;`  Expand the snippet named xxx. It is like that we insert the content of snippet xxx in place.

Snippet-define is allowed at top level only. Snippet-expand can be place at top level or in children selectors. Snippets can be nested: `@snippetA -> @snippetB -> @snippetC` (snippetA uses snippetB, snippetB uses snippetC); But snippets should not be circled: `@snippetA -> @snippetB -> @snippetA`.

The running semantics of snippet is simple: when temme encounters a snippet-expand, temme will replace the `@xxx` with its content.

(Note: This example is made up and the selector does not work with the real StackOverflow html) For example, a stackoverflow question asked by *person-A* may be edited by *person-B*. Without snippets, our temme-selector is: 

```
.ask-info@asked|pack {
  .time[title=$actionTime];
  .username{$username};
  .reputation{$reputation};
};
.edit-info@edited|pack {
  .time[title=$actionTime];
  .username{$username};
  .reputation{$reputation};
};
```

The children selectors in curly brace are duplicated. We can use snippet to deduplicate them:

```
@personInfo = {
  .time[title=$actionTime];
  .username{$username};
  .reputation{$reputation};
};
.ask-info@asked|pack { @personInfo; };
.edit-info@edited|pack { @personInfo; };
```

[playground-tutorial]: https://temme.js.org?example=tutorial-start
[example-value-capture]: https://temme.js.org?example=tutorial-value-capture
[example-default-value-capture]: https://temme.js.org?example=tutorial-default-value-capture
[example-array-capture]: https://temme.js.org?example=tutorial-array-capture
[example-default-array-capture]: https://temme.js.org?example=tutorial-default-array-capture
[example-parent-reference]: https://temme.js.org?example=tutorial-parent-reference
[example-nested-array-capture]: https://temme.js.org?example=tutorial-nested-array-capture
[example-multiple-selectors-at-top-level]: https://temme.js.org?example=tutorial-multiple-selectors-at-top-level
[example-assignments-at-top-level]: https://temme.js.org?example=tutorial-assignments-at-top-level
[example-assignments-in-content]: https://temme.js.org?example=tutorial-assignments-in-content
[example-assignments-in-children-selectors]: https://temme.js.org?example=tutorial-assignments-in-children-selectors
[example-filters]: https://temme.js.org?example=tutorial-filters
[example-content]: https://temme.js.org?example=tutorial-content
[example-special-filters-in-content]: https://temme.js.org?example=tutorial-special-filters-in-content
[example-content-functions]: https://temme.js.org?example=tutorial-content-functions

[example-so-all-answers-and-all-comments]: https://temme.js.org?example=so-all-answers-and-all-comments
[example-github-commits]: https://temme.js.org?example=github-commits
[example-github-issues]: https://temme.js.org?example=github-issues
[example-douban-short-reviews]: https://temme.js.org?example=douban-short-reviews-Chinese
[example-tmall-reviews]: https://temme.js.org?example=tmall-reviews-Chinese
