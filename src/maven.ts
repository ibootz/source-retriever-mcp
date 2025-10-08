import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_M2_REPO, MavenCoords } from './config.js';

export function resolveSourcesJarPath(coords: MavenCoords, m2RepoPath?: string): string {
  const repo = m2RepoPath && m2RepoPath.trim().length > 0 ? m2RepoPath : DEFAULT_M2_REPO;
  const groupPath = coords.groupId.replace(/\./g, '/');
  const baseDir = path.join(repo, groupPath, coords.artifactId, coords.version);
  const jarName = `${coords.artifactId}-${coords.version}-sources.jar`;
  return path.join(baseDir, jarName);
}

export function ensureFileExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`未找到源码包: ${filePath}`);
  }
}
