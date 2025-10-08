import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { resolveSourcesJarPath } from '../src/maven.js';

describe('maven.resolveSourcesJarPath', () => {
  it('builds expected -sources.jar path', () => {
    const p = resolveSourcesJarPath({
      groupId: 'com.google.guava',
      artifactId: 'guava',
      version: '32.0.0-jre'
    }, 'C:/m2');

    const expected = path.join('C:/m2', 'com', 'google', 'guava', 'guava', '32.0.0-jre', 'guava-32.0.0-jre-sources.jar');
    expect(p).toBe(expected);
  });
});
