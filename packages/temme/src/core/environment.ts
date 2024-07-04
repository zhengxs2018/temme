import { debuglog } from 'node:util';

import { Ast, SyntaxError } from '../ast';
import { t } from '../l10n';
import { type Filter, get_all_filters } from '../resources/filters';
import { get_all_modifiers, type Modifier } from '../resources/modifiers';
import { get_all_procedures, type Procedure } from '../resources/procedures';
import { CaptureResult } from './result';

const debug = debuglog('temme:environment');

export class Environment {
  private readonly _filters: Record<string, Filter>;
  private readonly _modifiers: Record<string, Modifier>;
  private readonly _procedures: Record<string, Procedure>;

  constructor() {
    this._filters = get_all_filters();
    this._modifiers = get_all_modifiers();
    this._procedures = get_all_procedures();
  }

  register_modifier(name: string, modifier: Modifier) {
    debug(t('register modifier: %s', name));
    this._modifiers[name] = modifier;
  }

  deregister(name: string) {
    debug(t('deregister modifier: %s', name));
    delete this._modifiers[name];
  }

  apply_procedure(descriptor: Ast.Procedure, result: CaptureResult, node: cheerio.Cheerio) {
    const { name, args } = descriptor;
    const procedure = this._procedures[name];

    if (typeof procedure !== 'function') {
      throw new SyntaxError(t('Unknown procedure: %s', name));
    }

    debug(t('apply procedure %s', name));
    return procedure(result, node, ...args);
  }

  apply_modifier(descriptor: Ast.Modifier, result: CaptureResult, capture: Ast.Capture, value: unknown) {
    const { name } = descriptor;
    const modifier = this._modifiers[name];

    if (typeof modifier !== 'function') {
      throw new SyntaxError(t('Unknown modifier: %s', name));
    }

    debug(t('apply modifier %s', name));

    const final = capture.filters.reduce((prev, f) => {
      return this.apply_filter(f, prev);
    }, value);

    debug(t('finally value is', final));

    return modifier(result, {
      name: capture.name,
      args: descriptor.args,
      value: final,
    });
  }

  apply_filter(descriptor: Ast.Filter, value: unknown) {
    const { name, args } = descriptor;
    const filter = this._filters[name];

    if (typeof filter !== 'function') {
      throw new SyntaxError(t('Unknown filter: %s', name));
    }

    debug(t('apply filter %s', name));
    return filter(value, ...args);
  }
}
