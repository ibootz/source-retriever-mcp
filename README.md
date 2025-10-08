# source-retriever-mcp

A server implementation following the MCP (Model Context Protocol) that retrieves Java source code text from local Maven repositories (MVP).

- Only supports Java + Maven (MVP)
- Locates `-sources.jar` files in local `~/.m2/repository`
- Extracts and reads `.java` files corresponding to specified `class`, with optional method source extraction
- Caches extraction results locally for faster repeated requests

## Quick Start

1. Install dependencies

```bash
npm i
```

2. Development run (stdio)

```bash
npm run dev
```

3. Build and start

```bash
npm run build
npm start
```

> This service uses MCP standard stdio transport and can be launched as a subprocess by MCP clients.

## MCP Tools

- Name: `get_java_source`
- Parameters:
  - `groupId` (string): e.g. `com.google.guava`
  - `artifactId` (string): e.g. `guava`
  - `version` (string): e.g. `32.0.0-jre`
  - `className` (string): full class name, e.g. `com.google.common.collect.ImmutableList`
  - `methodSignature` (string, optional): e.g. `of(java.lang.Object[])`
  - `m2RepoPath` (string, optional): local Maven repository path, default `~/.m2/repository`
  - `cacheDir` (string, optional): local cache directory, default `<project_directory>/.cache/sources`

- Output: MCP content object with `text` field containing source code and `meta` containing location information:

```json
{
  "text": "...java source code...",
  "meta": {
    "jarPath": ".../guava-32.0.0-jre-sources.jar",
    "entryPath": "com/google/common/collect/ImmutableList.java",
    "cached": true,
    "methodMatched": false
  }
}
```

## MCP Client Configuration Example (Claude Desktop)

Add to `claude_desktop_config.json`:

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

## Implementation Details

- `src/maven.ts`: Resolves `-sources.jar` paths based on `{groupId, artifactId, version}`
- `src/jar.ts`: Reads JAR entries, locates `.java` files and returns text
- `src/cache.ts`: Simple file caching with key `group/artifact/version/entryPath`
- `src/methodExtract.ts`: Naive method extraction (based on signature substring and bracket counting), returns full file if no match
- `src/service.ts`: Combines workflow, provides `getJavaSourceText()`
- `src/server.ts`: MCP server and tool registration

## Constraints and Notes

- Only supports existing `-sources.jar` files, no jar decompilation involved
- Falls back to top-level class `.java` file for inner classes (`$`)
- Method extraction is an MVP solution and may not be completely robust for complex declarations with generics/annotations/line breaks; a Java parser can be introduced later for enhancement

## Configuration

- Maven repository defaults to `~/.m2/repository`, can be overridden with `m2RepoPath` parameter
- Cache directory defaults to `<project_directory>/.cache/sources`, can be overridden with `cacheDir` parameter

## License

MIT
