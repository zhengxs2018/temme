import { debuglog } from 'node:util';

import { assign, isObject, pick } from 'lodash-es';

import { t } from '../l10n';

export type Filter = (value: any, ...param: any[]) => any;

const debug = debuglog('temme:filters');

export namespace FilterFormatters {
  export function nullable(format: Filter): Filter {
    return (value, ...args) => {
      if (value == null) {
        return null;
      }

      return format(value, ...args);
    };
  }

  export function flat(format: Filter): Filter {
    return (value, ...args) => {
      if (Array.isArray(value)) {
        return value.map(value => format(value, ...args));
      }

      return format(value, ...args);
    };
  }

  export const string = nullable(value => {
    if (typeof value === 'string') {
      return value;
    }

    return String(value);
  });

  export const number = flat(
    nullable(value => {
      if (typeof value === 'string') {
        return Number(value);
      }

      return value;
    }),
  );

  export const pack = flat((value: unknown, ...keys: string[]) => {
    if (isObject(value)) {
      return pick(value, ...keys);
    }

    return {};
  });
}

const _DEFAULT_FILTERS: Record<string, Filter> = {
  pack: FilterFormatters.flat,
  assign(value) {
    if (Array.isArray(value)) {
      return Object.assign({}, ...value);
    }

    return Object.assign({}, value);
  },
  compact(value: unknown[]) {
    return value.filter(Boolean);
  },
  flatten(value: unknown[][], depth?: number) {
    if (Array.isArray(value)) {
      return value.flat(depth);
    }

    return value;
  },
  first(value: unknown[]) {
    if (Array.isArray(value) || typeof value === 'string') {
      return value[0];
    }

    return value;
  },
  last(value: unknown[]) {
    if (Array.isArray(value) || typeof value === 'string') {
      return value[value.length - 1];
    }

    return value;
  },
  get(value, key) {
    if (value == null) {
      return null;
    }

    return value[key];
  },
  number: FilterFormatters.number,
  string: FilterFormatters.string,
  boolean(value: unknown) {
    return Boolean(value);
  },
  date(value: unknown) {
    switch (typeof value) {
      case 'string':
      case 'number':
        return new Date(value);
    }

    return value;
  },
  trim: FilterFormatters.flat((value: unknown) => {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    return String(value);
  }),
  substring(value: unknown, start: number, end?: number) {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value.substring(start, end);
    }

    return value;
  },
  split(value: string, separator: string) {
    if (value == null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return value.split(separator);
    }

    return [value];
  },
  slice(value: string, start?: number, end?: number) {
    if (value == null) {
      return [];
    }

    if (typeof value === 'string') {
      return value.slice(start, end);
    }

    if (Array.isArray(value)) {
      return (value as unknown[]).slice(start, end);
    }

    return [value];
  },
};

const _USER_FILTERS: Record<string, Filter> = {};

/** @internal */
export function get_all_filters() {
  return { ..._DEFAULT_FILTERS, ..._USER_FILTERS };
}

export namespace FiltersRegistry {
  export function register(name: string, filter: Filter) {
    debug(t('register filter: %s', name));
    _DEFAULT_FILTERS[name] = filter;
  }

  export function deregister(name: string) {
    debug(t('deregister filter: %s', name));
    delete _USER_FILTERS[name];
  }
}
