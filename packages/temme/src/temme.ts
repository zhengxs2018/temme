import { compile, Token } from './compiler';
import { DocumentExtractor, Environment, Result } from './core';

export function temme<T = Result>(source: string | cheerio.Root, rule: string | Token[]) {
  const env = new Environment();
  const extractor = new DocumentExtractor(env);

  const tokens = typeof rule === 'string' ? compile(rule) : rule;

  return extractor.load(source).execute<T>(tokens);
}

export const version = process.env.PKG_VERSION as string;
