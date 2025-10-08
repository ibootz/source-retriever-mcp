# source-retriever-mcp

一个遵循 MCP（Model Context Protocol）的服务端，实现从本地 Maven 仓库中获取 Java 源码文本（MVP）。

- 仅支持 Java + Maven（MVP）
- 在本地 `~/.m2/repository` 中定位 `-sources.jar`
- 解压并读取指定 `class` 对应的 `.java` 文件，可选提取具体方法源码
- 本地缓存提取结果，加速重复请求

## 快速开始

1. 安装依赖

```bash
npm i
```

2. 开发运行（stdio）

```bash
npm run dev
```

3. 构建与启动

```bash
npm run build
npm start
```

> 本服务使用 MCP 标准的 stdio 传输，可作为子进程被 MCP 客户端拉起。

## MCP 工具

- 名称: `get_java_source`
- 入参:
  - `groupId` (string): 例如 `com.google.guava`
  - `artifactId` (string): 例如 `guava`
  - `version` (string): 例如 `32.0.0-jre`
  - `className` (string): 完整类名，例如 `com.google.common.collect.ImmutableList`
  - `methodSignature` (string, 可选): 例如 `of(java.lang.Object[])`
  - `m2RepoPath` (string, 可选): 本地 Maven 仓库路径，默认 `~/.m2/repository`
  - `cacheDir` (string, 可选): 本地缓存目录，默认 `<项目目录>/.cache/sources`

- 输出: MCP 内容对象，`text` 字段为源码文本，`meta` 包含定位信息：

```json
{
  "text": "...java 源码...",
  "meta": {
    "jarPath": ".../guava-32.0.0-jre-sources.jar",
    "entryPath": "com/google/common/collect/ImmutableList.java",
    "cached": true,
    "methodMatched": false
  }
}
```

## MCP 客户端配置示例（Claude Desktop）

在 `claude_desktop_config.json` 中添加：

```jsonc
{
  "mcpServers": {
    "source-retriever-mcp": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {}
    }
  }
}
```

## 实现说明

- `src/maven.ts`: 基于 `{groupId, artifactId, version}` 解析 `-sources.jar` 路径
- `src/jar.ts`: 读取 JAR 条目，定位 `.java` 文件并返回文本
- `src/cache.ts`: 简单文件缓存，缓存键为 `group/artifact/version/entryPath`
- `src/methodExtract.ts`: 朴素方法提取（基于签名子串与括号计数），若未匹配则返回整文件
- `src/service.ts`: 组合流程，提供 `getJavaSourceText()`
- `src/server.ts`: MCP 服务端与工具注册

## 约束与注意

- 仅支持已存在的 `-sources.jar`，不涉及 jar 反编译
- 对内部类（`$`）会回退到顶层类 `.java` 文件
- 方法提取为 MVP 方案，可能对泛型/注解/换行等复杂声明不完全稳健，后续可引入 Java 解析器增强

## 配置

- `Maven` 仓库默认 `~/.m2/repository`，可在调用时传入 `m2RepoPath` 覆盖
- 缓存目录默认 `<项目目录>/.cache/sources`，可在调用时传入 `cacheDir` 覆盖

## License

MIT
