import { describe, it, expect } from 'vitest';
import { extractMethod } from '../src/methodExtract.js';

const JAVA = `/**\n * Class Javadoc\n */\npublic class Foo {\n  /** Doc for bar */\n  public int bar(java.lang.String s, int n) {\n     if (n > 0) { return 1; }\n     return 0;\n  }\n  public void baz() {}\n}\n`;

describe('extractMethod', () => {
  it('returns whole file when signature not found', () => {
    const { snippet, found } = extractMethod(JAVA, 'notExisting(sig)');
    expect(found).toBe(false);
    expect(snippet).toContain('public class Foo');
    expect(snippet.length).toBe(JAVA.length);
  });

  it('extracts method block including javadoc when signature matches', () => {
    const sig = 'bar(java.lang.String s, int n)';
    const { snippet, found } = extractMethod(JAVA, sig);
    expect(found).toBe(true);
    expect(snippet).toContain('Doc for bar');
    expect(snippet.trim().startsWith('/**')).toBe(true);
    expect(snippet).toContain('public int bar');
    expect(snippet.trim().endsWith('}')).toBe(true);
  });
});
