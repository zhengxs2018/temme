import assert from 'node:assert';
import { debuglog } from 'node:util';

import cheerio from 'cheerio';

import { type Ast } from '../ast';
import { is_capture } from '../compiler';
import { t } from '../l10n';
import { CaptureResult } from '../core/result';

const debug = debuglog('temme:procedures');

/** @private */
const _DEFAULT_PROCEDURES: Record<string, Procedure> = {
  text(result: CaptureResult, node: cheerio.Cheerio, capture: Ast.Capture) {
    result.add(capture, node.text());
  },
  html(result: CaptureResult, node: cheerio.Cheerio, capture: Ast.Capture) {
    result.add(capture, node.html());
  },
  node(result: CaptureResult, node: cheerio.Cheerio, capture: Ast.Capture) {
    result.add(capture, cheerio(node));
  },
  /**
   * Try to capture text within a node's text.
   * This content function can have three forms:
   * 1. find('before-string', $capture)   Try to capture the text after 'before-string'
   * 2. find($capture, 'after-string')    Try to capture the text before 'after-string'
   * 3. find('pre', $capture, 'post')     Try to capture the text between 'pre' and 'post'
   * */
  find(result: CaptureResult, node: cheerio.Cheerio, ...args: (string | Ast.Capture)[]) {
    const { before, after, capture } = normalize_find_args(args);

    assert(is_capture(capture), t('Invalid arguments received by match(...)'));

    let source = node.text();

    if (before) {
      const i = source.indexOf(before);
      if (i === -1) {
        return;
      }
      source = source.substring(i + before.length);
    }

    if (after) {
      const i = source.indexOf(after);
      if (i === -1) {
        return;
      }
      source = source.substring(0, i);
    }

    result.add(capture, source);
  },
  assign(result: CaptureResult, _: cheerio.Cheerio, capture: Ast.Capture, value: Ast.Literal) {
    result.force_add(capture, value);
  },
};

/** @private */
const _USER_PROCEDURES: Record<string, Procedure> = {};

function normalize_find_args(args: unknown[]) {
  const size = args.length;

  if (size === 2) {
    if (typeof args[0] == 'string') {
      return {
        before: args[0] as string,
        after: undefined,
        capture: args[1] as Ast.Capture,
      };
    }

    return {
      before: undefined,
      after: args[1] as string,
      capture: args[0] as Ast.Capture,
    };
  }

  if (size === 3) {
    return {
      before: args[0] as string,
      after: args[2] as string,
      capture: args[1] as Ast.Capture,
    };
  }

  return {
    before: undefined,
    after: undefined,
    capture: undefined,
  };
}

/** @internal */
export function get_all_procedures() {
  return { ..._DEFAULT_PROCEDURES, ..._USER_PROCEDURES };
}

export type Procedure = (result: CaptureResult, node: cheerio.Cheerio, ...args: any[]) => void;

export namespace ProceduresRegistry {
  export function register(name: string, procedure: Procedure) {
    debug(t('register procedure: %s', name));
    _USER_PROCEDURES[name] = procedure;
  }

  export function deregister(name: string) {
    debug(t('deregister procedure: %s', name));
    delete _USER_PROCEDURES[name];
  }
}
