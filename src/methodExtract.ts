// TODO: 方法解析改进计划
// 1) 现实现依赖签名子串 + 括号计数，无法稳健覆盖：换行签名、注解、泛型、Lombok生成方法、重载、多嵌套内部类等。
// 2) 后续可引入 Java 源码解析器（如基于 JavaParser 的本地调用或轻量 TS 解析器/正则增强）以构建 AST，
//    通过 AST 精准定位方法声明区间与 Javadoc/注释块，兼容注解、泛型与换行等复杂情况。
// 3) 方法匹配策略应支持：方法名 + 形参类型擦除比对、可变参数/数组、重载歧义解析、泛型实参忽略。
// 4) 在返回片段时，支持可选上下文范围（如包含/不包含 Javadoc、前置注解、方法前后若干行）。

export interface MethodExtractResult {
  snippet: string;
  found: boolean;
}

function findJavadocStart(lines: string[], fromLine: number): number {
  let i = fromLine - 1;
  while (i >= 0) {
    const line = lines[i].trim();
    if (line.endsWith('*/')) {
      // 回溯到开头
      while (i >= 0 && !lines[i].trim().startsWith('/**')) {
        i--;
      }
      return Math.max(0, i);
    }
    if (!line.startsWith('*') && !line.startsWith('/**')) {
      break;
    }
    i--;
  }
  return fromLine;
}

export function extractMethod(javaText: string, methodSignature: string): MethodExtractResult {
  const idx = javaText.indexOf(methodSignature);
  if (idx < 0) {
    return { snippet: javaText, found: false };
  }

  // 找到方法声明行
  let start = idx;
  while (start > 0 && javaText[start - 1] !== '\n') {
    start--;
  }

  // 从方法声明向后找到第一个 '{'
  let openIdx = javaText.indexOf('{', start);
  if (openIdx < 0) {
    return { snippet: javaText, found: false };
  }

  // 以括号计数匹配方法块
  let depth = 0;
  let endIdx = openIdx;
  for (let i = openIdx; i < javaText.length; i++) {
    const ch = javaText[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const pre = javaText.substring(0, start);
  const preLines = pre.split(/\r?\n/);
  const declLine = preLines.length; // 1-based like length, but we use 0-based index later
  const lines = javaText.split(/\r?\n/);

  // 计算包含Javadoc的起始行
  const startLineIdx = findJavadocStart(lines, declLine - 1);
  let javadocStartOffset = 0;
  for (let i = 0; i < startLineIdx; i++) {
    javadocStartOffset += lines[i].length + 1; // +1 for newline
  }

  const snippet = javaText.substring(javadocStartOffset, endIdx);
  return { snippet, found: true };
}
