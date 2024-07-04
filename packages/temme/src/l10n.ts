import { format } from 'node:util';

// TODO: 支持国际化
export function t(message: string, ...param: unknown[]) {
  if (param.length === 0) {
    return message;
  }

  return format(message, ...param);
}
