import * as os from 'os';
import * as path from 'path';

export const DEFAULT_M2_REPO = path.join(os.homedir(), '.m2', 'repository');
export const DEFAULT_CACHE_DIR = path.resolve(process.cwd(), '.cache', 'sources');

export interface MavenCoords {
  groupId: string;
  artifactId: string;
  version: string;
}

export interface GetSourceArgs extends MavenCoords {
  className: string; // fully-qualified, e.g. com.example.Foo$Inner
  methodSignature?: string; // e.g. "bar(java.lang.String,int)"
  m2RepoPath?: string;
  cacheDir?: string;
}
