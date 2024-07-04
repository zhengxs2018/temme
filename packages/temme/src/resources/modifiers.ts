import { debuglog } from 'node:util';

import { DEFAULT_CAPTURE_KEY } from '../ast';
import { CaptureResult } from '../core/result';
import { t } from '../l10n';

const debug = debuglog('temme:modifiers');

/** @private */
const _DEFAULT_MODIFIERS: Record<string, Modifier> = {
  add(result: CaptureResult, binding: Modifier.Binding) {
    const { name, value } = binding;

    if (value == null) {
      return;
    }

    // TODO: filter empty object?
    result.set(name, value);
  },
  forceAdd(result: CaptureResult, binding: Modifier.Binding) {
    const { name, value } = binding;
    result.set(name, value);
  },
  candidate(result: CaptureResult, binding: Modifier.Binding) {
    const { name, value } = binding;
    const oldValue = result.get(name);

    if (oldValue == null) {
      result.set(name, value);
    }
  },
  array(result: CaptureResult, binding: Modifier.Binding) {
    const { name, value } = binding;
    const array = result.get<unknown[]>(name);

    if (Array.isArray(array)) {
      result.set(name, [...array, value]);
    } else {
      result.set(name, [value]);
    }
  },
  spread(result: CaptureResult, binding: Modifier.Binding) {
    const { name, value } = binding;

    if (value == null) {
      return;
    }

    let [prefix = name] = binding.args;

    if (prefix === DEFAULT_CAPTURE_KEY) {
      prefix = '';
    }

    // TODO support array?
    for (const key of Object.keys(value)) {
      // TODO
      // @ts-expect-error
      result.set(prefix + key, value[key]);
    }
  },
};

/** @private */
const _USER_MODIFIERS: Record<string, Modifier> = {};

export namespace Modifier {
  export interface Binding {
    name: string;
    args: unknown[];
    value: unknown;
  }
}

export type Modifier = (result: CaptureResult, binding: Modifier.Binding) => void;

/** @internal */
export function get_all_modifiers() {
  return { ..._DEFAULT_MODIFIERS, ..._USER_MODIFIERS };
}

export namespace ModifiersRegistry {
  export function register(name: string, modifier: Modifier) {
    debug(t('register modifier: %s', name));
    _USER_MODIFIERS[name] = modifier;
  }

  export function deregister(name: string) {
    debug(t('deregister modifier: %s', name));
    delete _USER_MODIFIERS[name];
  }
}
