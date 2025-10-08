import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getJavaSourceText } from './service.js';
import type { GetSourceArgs } from './config.js';

const server = new McpServer({
  name: 'source-retriever-mcp',
  version: '0.1.0'
});

const inputSchema = {
  groupId: z.string().min(1).describe('Maven groupId, 如: com.google.guava'),
  artifactId: z.string().min(1).describe('Maven artifactId, 如: guava'),
  version: z.string().min(1).describe('版本号, 如: 32.0.0-jre'),
  className: z.string().min(1).describe('完整类名, 如: com.google.common.collect.ImmutableList'),
  methodSignature: z.string().optional().describe('可选方法签名, 如: of(java.lang.Object[])'),
  m2RepoPath: z.string().optional().describe('本地Maven仓库路径, 默认~/.m2/repository'),
  cacheDir: z.string().optional().describe('本地缓存目录, 默认项目/.cache/sources')
} as const;

const outputSchema = {
  text: z.string(),
  meta: z.object({
    jarPath: z.string(),
    entryPath: z.string(),
    cached: z.boolean(),
    methodMatched: z.boolean()
  })
} as const;

server.registerTool(
  'get_java_source',
  {
    title: '获取Java源码',
    description: '从本地Maven仓库中提取指定类(或方法)的源码文本',
    inputSchema,
    outputSchema
  },
  async (args: GetSourceArgs) => {
    try {
      const result = getJavaSourceText(args);
      return {
        content: [
          { type: 'text', text: result.text }
        ],
        structuredContent: result
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          { type: 'text', text: `获取源码失败: ${message}` }
        ],
        isError: true
      } as any;
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // 输出到stderr以便客户端诊断
  console.error('[source-retriever-mcp] 启动失败:', err?.message || err);
  process.exit(1);
});
