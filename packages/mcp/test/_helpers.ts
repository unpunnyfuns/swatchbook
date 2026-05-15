import { dirname } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { loadProject, type Project } from '@unpunnyfuns/swatchbook-core';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { createServer } from '#/server.ts';

const fixtureCwd = dirname(tokensDir);

/**
 * Load the workspace's `@unpunnyfuns/swatchbook-tokens` fixture project.
 * Reused across mcp tests so handlers see the same realistic shape an
 * agent will face in practice — multi-axis (mode/brand/contrast)
 * resolver, real composite tokens, populated `listing`.
 *
 * `beforeAll`-friendly: parsing the fixture takes ~1s, far too slow
 * for a `beforeEach`. Each test that needs the project caches it via
 * the helper below.
 */
export async function loadFixtureProject(): Promise<Project> {
  return loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
      cssVarPrefix: 'sb',
    },
    fixtureCwd,
  );
}

export interface McpTestHarness {
  /** Invoke a registered tool by name; returns the raw `content` array. */
  callTool(name: string, args?: Record<string, unknown>): Promise<unknown>;
  /** Convenience: invoke a tool and JSON.parse its first text block. */
  callJson<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T>;
  /** Convenience: invoke a tool and return the first text block verbatim. */
  callText(name: string, args?: Record<string, unknown>): Promise<string>;
  /** Swap the server's underlying project — exercises the live-reload path. */
  setProject(next: Project): void;
  /** Tear down both transports. */
  close(): Promise<void>;
}

/**
 * Spin up an in-memory client ↔ server pair bound to `project`. The
 * harness wraps `client.callTool` with helpers that return either the
 * raw content array, the parsed first JSON block, or the first text
 * block verbatim — covering the three response shapes mcp tools emit.
 */
export async function startTestServer(project: Project): Promise<McpTestHarness> {
  const server = createServer(project);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const callTool = async (name: string, args: Record<string, unknown> = {}): Promise<unknown> => {
    const result = await client.callTool({ name, arguments: args });
    return result.content;
  };

  return {
    callTool,
    callJson: async <T>(name: string, args: Record<string, unknown> = {}) => {
      const content = (await callTool(name, args)) as { type: string; text: string }[];
      const first = content?.[0];
      if (!first || first.type !== 'text') {
        throw new Error(`expected text content from ${name}, got ${JSON.stringify(content)}`);
      }
      return JSON.parse(first.text) as T;
    },
    callText: async (name: string, args: Record<string, unknown> = {}) => {
      const content = (await callTool(name, args)) as { type: string; text: string }[];
      const first = content?.[0];
      if (!first || first.type !== 'text') {
        throw new Error(`expected text content from ${name}, got ${JSON.stringify(content)}`);
      }
      return first.text;
    },
    setProject: server.setProject,
    close: async () => {
      await Promise.all([client.close(), server.close()]);
    },
  };
}
