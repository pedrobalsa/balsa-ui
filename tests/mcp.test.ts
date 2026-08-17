import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  callTool,
  handleMessage,
  latestProtocolVersion,
  listTools,
  serveStdio,
  supportedProtocolVersions,
  tools,
} from "../scripts/mcp-server.mjs";
import { diffStateSummary, updatePolicy } from "../scripts/diff-installed.mjs";

/**
 * The MCP surface is a protocol, so the tests are about the protocol: a reply
 * that is well-formed for a client we cannot see. The failures that matter here
 * are silent ones — a notification that gets answered shifts every later reply
 * onto the wrong request, and a stray line on stdout desynchronizes the stream
 * without any error to read.
 */

describe("handshake", () => {
  it("answers with the version the client asked for when it speaks it", async () => {
    for (const version of supportedProtocolVersions) {
      const reply = await handleMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: version },
      });
      expect(reply?.result.protocolVersion).toBe(version);
    }
  });

  it("falls back to its newest version rather than failing an unknown one", async () => {
    const reply = await handleMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "1999-01-01" },
    });
    expect(reply?.result.protocolVersion).toBe(latestProtocolVersion);
    expect(reply?.result.capabilities.tools).toBeDefined();
  });

  /**
   * A notification carries no id and must never be answered. Replying to one
   * puts an extra message on the stream, and every response after it is read
   * against the wrong request — a fault that shows up as unrelated nonsense far
   * from its cause.
   */
  it("never answers a notification", async () => {
    expect(await handleMessage({ jsonrpc: "2.0", method: "notifications/initialized" }))
      .toBeUndefined();
    expect(await handleMessage({ jsonrpc: "2.0", method: "notifications/cancelled" }))
      .toBeUndefined();
    expect(await handleMessage({ jsonrpc: "2.0", method: "nonsense" })).toBeUndefined();
  });

  it("reports an unknown method as a protocol error", async () => {
    const reply = await handleMessage({ jsonrpc: "2.0", id: 4, method: "nonsense/method" });
    expect(reply?.error.code).toBe(-32601);
  });
});

describe("tools", () => {
  it("describes every tool it advertises", () => {
    expect(listTools().length).toBe(tools.length);
    for (const tool of listTools()) {
      expect(tool.description, tool.name).toBeTruthy();
      expect(tool.inputSchema.type, tool.name).toBe("object");
    }
  });

  /**
   * Every tool reads. The write path stays in the CLI on purpose: its refusals
   * are its most important behaviour, and `--force` in a shell history records a
   * decision someone made. A tool call that overwrites edited source records
   * nothing, so this fails if one is ever added without that being reconsidered.
   */
  it("exposes nothing that writes", () => {
    const writing = tools.filter((tool) => /^(add|init|install|create|write|update|apply)_/.test(tool.name));
    expect(writing.map((tool) => tool.name)).toEqual([]);
  });

  /**
   * A component that does not exist is a normal answer the model should read and
   * act on. Returning it as a JSON-RPC error would make it a transport fault the
   * model never sees, and it would retry the same call.
   */
  it("returns a failed call as readable content, not a protocol error", async () => {
    const result = await callTool("component_contract", { name: "no-such-component" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("no-such-component");

    const missing = await callTool("not_a_tool", {});
    expect(missing.isError).toBe(true);
  });

  it("searches by intent and says why each result matched", async () => {
    const result = await callTool("search_components", { query: "select", limit: 3 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("matched:");
    expect(result.content[0].text).toContain("npx balsa-ui@latest add");
  });

  it("says so plainly when nothing matches", async () => {
    const result = await callTool("search_components", { query: "zzzzqqqq" });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Nothing matched");
  });

  it("reports a contract an agent could implement against", async () => {
    const { content } = await callTool("component_contract", { name: "select" });
    expect(content[0].text).toContain("## Public API");
    expect(content[0].text).toContain("### Props");
  });

  it("accepts a qualified registry reference and an optional framework", async () => {
    const qualified = await callTool("component_contract", { name: "@balsa/select" });
    expect(qualified.isError).toBeUndefined();
    expect(qualified.content[0].text).toContain("## Public API");

    const scoped = await callTool("component_contract", { name: "select", framework: "vue" });
    expect(scoped.isError).toBeUndefined();
    expect(scoped.content[0].text).toContain("# Select");

    const search = await callTool("search_components", { query: "select", framework: "vue", limit: 3 });
    expect(search.isError).toBeUndefined();
    expect(search.content[0].text).toContain("select");
  });

  it("reports how far each design-system dimension reaches upstream", async () => {
    const { content } = await callTool("design_system", {});
    expect(content[0].text).toContain("spacing");
    expect(content[0].text).not.toContain("unmeasured");
  });
});

/**
 * `plan_update` must answer with what `update` would actually do. Two copies of
 * the rules is two answers that can disagree, and the one the agent reads would
 * be the one nobody runs.
 */
describe("plan_update", () => {
  it("reads the same policy the update command acts on", () => {
    for (const state of Object.keys(diffStateSummary)) {
      expect(updatePolicy[state], state).toBeDefined();
    }
  });

  it("plans without writing", async () => {
    const { content } = await callTool("plan_update", {});
    expect(content[0].text).toMatch(/would (update|keep)|Nothing is installed/);
  });
});

/**
 * The transport's one hard rule: stdout carries protocol messages and nothing
 * else. Anything downstream is free to log — several of these libraries do — and
 * a single stray line desynchronizes the stream with no error anywhere.
 */
describe("stdio transport", () => {
  it("keeps a tool that logs off stdout", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const captured: string[] = [];
    output.on("data", (chunk) => captured.push(String(chunk)));

    const noisy = {
      name: "noisy_probe",
      description: "Logs, the way a library might.",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        console.log("a library wrote this to stdout");
        console.warn("and this");
        return "quiet answer";
      },
    };
    tools.push(noisy);

    const realLog = console.log;
    const realWarn = console.warn;
    const realInfo = console.info;
    const stderrWrite = process.stderr.write;
    let stderrText = "";
    process.stderr.write = ((chunk: string) => {
      stderrText += chunk;
      return true;
    }) as typeof process.stderr.write;

    try {
      const served = serveStdio({ input, output, serverVersion: "test" });
      input.write(`${JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "noisy_probe", arguments: {} },
      })}\n`);
      // Malformed input must not take the server down with it.
      input.write("not json at all\n");
      input.end();
      await served;

      const lines = captured.join("").trim().split("\n").filter(Boolean);
      for (const line of lines) {
        expect(() => JSON.parse(line), `non-protocol output on stdout: ${line}`).not.toThrow();
      }
      expect(JSON.parse(lines[0]).result.content[0].text).toBe("quiet answer");
      expect(JSON.parse(lines[1]).error.code).toBe(-32700);
      expect(stderrText).toContain("a library wrote this to stdout");
    } finally {
      console.log = realLog;
      console.warn = realWarn;
      console.info = realInfo;
      process.stderr.write = stderrWrite;
      tools.splice(tools.indexOf(noisy), 1);
    }
  });
});
