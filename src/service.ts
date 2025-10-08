import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_CACHE_DIR, GetSourceArgs, MavenCoords } from './config.js';
import { resolveSourcesJarPath, ensureFileExists } from './maven.js';
import { cachePathForEntry, readIfExists } from './cache.js';
import { findJavaEntryInJar, readEntryText, writeCacheFile } from './jar.js';
import { extractMethod } from './methodExtract.js';

export interface SourceResultMeta {
  jarPath: string;
  entryPath: string;
  cached: boolean;
  methodMatched: boolean;
}

export interface SourceResult {
  text: string;
  meta: SourceResultMeta;
}

function getCacheDir(cacheDir?: string): string {
  return cacheDir && cacheDir.trim().length > 0 ? cacheDir : DEFAULT_CACHE_DIR;
}

export function getJavaSourceText(args: GetSourceArgs): SourceResult {
  const m2 = args.m2RepoPath;
  const jar = resolveSourcesJarPath(toCoords(args), m2);
  ensureFileExists(jar);

  const entry = findJavaEntryInJar(jar, args.className);
  if (!entry) {
    throw new Error(`未在源码包中定位到类文件: ${args.className}`);
  }

  const cacheDir = getCacheDir(args.cacheDir);
  const cachePath = cachePathForEntry(cacheDir, toCoords(args), entry);

  let content = readIfExists(cachePath);
  let cached = false;
  if (content == null) {
    content = readEntryText(jar, entry);
    writeCacheFile(cachePath, content);
  } else {
    cached = true;
  }

  let methodMatched = false;
  let textToReturn = content;
  if (args.methodSignature && args.methodSignature.trim().length > 0) {
    const { snippet, found } = extractMethod(content, args.methodSignature);
    methodMatched = found;
    textToReturn = snippet;
  }

  return {
    text: textToReturn,
    meta: {
      jarPath: jar,
      entryPath: entry,
      cached,
      methodMatched
    }
  };
}

function toCoords(args: GetSourceArgs): MavenCoords {
  return {
    groupId: args.groupId,
    artifactId: args.artifactId,
    version: args.version
  };
}
