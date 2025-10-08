import { describe, it, expect } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { getJavaSourceText } from '../src/service.js';

function writeSourcesJar(base: string, coords: { groupId: string; artifactId: string; version: string }, entries: Record<string, string>) {
  const groupPath = coords.groupId.replace(/\./g, path.sep);
  const dir = path.join(base, groupPath, coords.artifactId, coords.version);
  fs.mkdirSync(dir, { recursive: true });
  const jarPath = path.join(dir, `${coords.artifactId}-${coords.version}-sources.jar`);
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(entries)) {
    zip.addFile(name.replace(/\\/g, '/'), Buffer.from(content, 'utf8'));
  }
  zip.writeZip(jarPath);
  return jarPath;
}

describe('service.getJavaSourceText', () => {
  it('extracts class and caches content, supports method snippet', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-service-'));
    const m2 = path.join(tmp, 'm2');
    const cacheDir = path.join(tmp, 'cache');

    const coords = { groupId: 'com.example', artifactId: 'demo', version: '1.0.0' };
    const javaPath = 'com/example/Foo.java';
    const java = `package com.example;\npublic class Foo {\n  /** javadoc */\n  public int bar(java.lang.String s, int n) {\n    if (n > 0) { return 1; }\n    return 0;\n  }\n}\n`;

    const jarPath = writeSourcesJar(m2, coords, { [javaPath]: java });
    expect(fs.existsSync(jarPath)).toBe(true);

    // 1st call: not cached
    const r1 = getJavaSourceText({
      ...coords,
      className: 'com.example.Foo',
      methodSignature: 'bar(java.lang.String s, int n)',
      m2RepoPath: m2,
      cacheDir
    });
    expect(r1.meta.cached).toBe(false);
    expect(r1.meta.entryPath.endsWith('com/example/Foo.java')).toBe(true);
    expect(r1.meta.methodMatched).toBe(true);
    expect(r1.text).toContain('public int bar');

    // 2nd call: should load from cache
    const r2 = getJavaSourceText({
      ...coords,
      className: 'com.example.Foo',
      methodSignature: 'bar(java.lang.String s, int n)',
      m2RepoPath: m2,
      cacheDir
    });
    expect(r2.meta.cached).toBe(true);
    expect(r2.meta.methodMatched).toBe(true);
  });
});
