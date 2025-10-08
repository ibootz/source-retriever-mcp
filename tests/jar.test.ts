import { describe, it, expect } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { findJavaEntryInJar, readEntryText, topLevelClassName } from '../src/jar.js';

function makeJar(entries: Record<string, string>, outPath: string) {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(entries)) {
    zip.addFile(name, Buffer.from(content, 'utf8'));
  }
  zip.writeZip(outPath);
}

describe('jar helpers', () => {
  it('topLevelClassName extracts package path and top class', () => {
    const r = topLevelClassName('com.example.Foo$Inner');
    expect(r.pkgPath).toBe('com/example');
    expect(r.topClass).toBe('Foo');
  });

  it('finds Java entry and reads it', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-jar-'));
    const jar = path.join(tmp, 'demo-sources.jar');
    makeJar({
      'com/example/Foo.java': 'package com.example;\npublic class Foo {}\n',
      'com/example/other/Bar.java': 'package com.example.other; class Bar {}\n'
    }, jar);

    const entry = findJavaEntryInJar(jar, 'com.example.Foo$Inner');
    expect(entry).toBe('com/example/Foo.java');
    const text = readEntryText(jar, entry!);
    expect(text).toContain('class Foo');
  });
});
