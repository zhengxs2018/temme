import { type Ast, DEFAULT_CAPTURE_KEY } from '../ast';
import { Environment } from './environment';

const ADD: Ast.Modifier = { name: 'add', args: [] };
const FORCE_ADD: Ast.Modifier = { name: 'forceAdd', args: [] };

export type Result = Record<string, unknown>;

export class CaptureResult {
  private readonly result: {
    [name: string]: unknown;
    ['@@default-capture@@']?: Result;
  } = {};

  constructor(private readonly env: Environment) {}

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    const value = this.result[key] as T;
    return value == null ? defaultValue : value;
  }

  set(key: string, value: unknown) {
    this.result[key] = value;
  }

  add(capture: Ast.Capture, value: unknown) {
    this.env.apply_modifier(ADD, this, capture, value);
  }

  force_add(capture: Ast.Capture, value: unknown) {
    this.env.apply_modifier(FORCE_ADD, this, capture, value);
  }

  get_result<T = Result>(): T | null {
    const result = this.result;
    const returnVal = result[DEFAULT_CAPTURE_KEY] ?? result;

    if (Object.keys(returnVal).length) {
      return returnVal as T;
    }

    return null;
  }
}
