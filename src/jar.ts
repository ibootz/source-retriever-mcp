import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';

export interface JavaEntryResult {
  entryPath: string;
  content: string;
}

export function topLevelClassName(className: string): { pkgPath: string; topClass: string } {
  const lastDot = className.lastIndexOf('.');
  const pkg = lastDot >= 0 ? className.substring(0, lastDot) : '';
  const cls = lastDot >= 0 ? className.substring(lastDot + 1) : className;
  const top = cls.split('$')[0];
  return {
    pkgPath: pkg.replace(/\./g, '/'),
    topClass: top
  };
}

export function findJavaEntryInJar(jarPath: string, fqClass: string): string | null {
  const zip = new AdmZip(jarPath);
  const entries = zip.getEntries();
  const { pkgPath, topClass } = topLevelClassName(fqClass);
  const expected = path.posix.join(pkgPath, `${topClass}.java`);

  // 优先精确匹配
  const exact = entries.find((e: { isDirectory: boolean; entryName: string }) => !e.isDirectory && e.entryName === expected);
  if (exact) {
    return exact.entryName;
  }

  // 回退：在包目录下模糊匹配同名文件
  const candidates = entries.filter((e: { isDirectory: boolean; entryName: string }) => !e.isDirectory && e.entryName.endsWith(`/${topClass}.java`));
  if (candidates.length > 0) {
    // 选择路径最短者
    candidates.sort((a: { entryName: string }, b: { entryName: string }) => a.entryName.length - b.entryName.length);
    return candidates[0].entryName;
  }

  return null;
}

export function readEntryText(jarPath: string, entryPath: string): string {
  const zip = new AdmZip(jarPath);
  const entry = zip.getEntry(entryPath);
  if (!entry) {
    throw new Error(`JAR中未找到条目: ${entryPath}`);
  }
  const buf = entry.getData();
  return buf.toString('utf8');
}

export function writeCacheFile(absPath: string, content: string): void {
  const dir = path.dirname(absPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absPath, content, 'utf8');
}
