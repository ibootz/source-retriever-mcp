import * as path from 'path';
import * as fs from 'fs';
import { MavenCoords } from './config.js';

export function cachePathForEntry(baseDir: string, coords: MavenCoords, entryPath: string): string {
  const safeEntry = entryPath.replace(/\\/g, '/');
  return path.join(baseDir, coords.groupId, coords.artifactId, coords.version, safeEntry);
}

export function readIfExists(absPath: string): string | null {
  if (fs.existsSync(absPath)) {
    return fs.readFileSync(absPath, 'utf8');
  }
  return null;
}
