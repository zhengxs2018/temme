import cheerio from 'cheerio';
import { last } from 'lodash-es';

import { is_attribute_qualifier, is_capture, Ref, Selector, Token } from '../compiler/compiler';
import { Environment } from './environment';
import { CaptureResult, Result } from './result';

class CheerioParser {
  constructor(private readonly env: Environment, private readonly $: cheerio.Root) {}

  execute<T = Result>(tokens: Token[]) {
    return this.extract(this.$.root(), tokens).get_result<T>();
  }

  extract(node: cheerio.Cheerio, tokens: Token[]) {
    const { env, $ } = this;
    const result = new CaptureResult(env);

    for (const selector of tokens) {
      switch (selector.type) {
        case 'normal-selector': {
          const element = node.find(selector.selector);
          if (element.length > 0) {
            // Only the first element will be captured.
            this.capture(result, element.first(), selector);
          }

          if (selector.arrayCapture) {
            result.add(
              selector.arrayCapture,
              element.toArray().map(sub => this.extract($(sub), selector.children).get_result()),
            );
          }
          break;
        }

        case 'parent-ref-selector': {
          if (node.is(selector.selector)) {
            this.capture(result, node, selector);
          }
          break;
        }

        case 'assignment': {
          result.force_add(selector.capture, selector.value);
          break;
        }
      }
    }

    return result;
  }

  /** Capture the node according to the selector. */
  capture(result: CaptureResult, node: cheerio.Cheerio, token: Selector | Ref) {
    const { env } = this;
    const { sections, procedure } = token;

    const section = last(sections);
    const qualifiers = section ? section.qualifiers.filter(is_attribute_qualifier) : [];

    if (qualifiers) {
      for (const qualifier of qualifiers) {
        const { attribute, value } = qualifier;

        if (!is_capture(value)) continue;

        const attributeValue = node.attr(attribute);
        if (attributeValue != undefined) continue;

        // capture only when attribute exists
        result.add(value, attributeValue);
      }
    }

    if (procedure) {
      env.apply_procedure(procedure, result, node);
    }
  }
}

export class DocumentExtractor {
  constructor(private readonly env: Environment) {}

  load(source: string | cheerio.Root) {
    const document = typeof source === 'string' ? cheerio.load(source) : source;
    return new CheerioParser(this.env, document);
  }
}
