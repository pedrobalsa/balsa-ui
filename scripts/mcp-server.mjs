/**
 * Balsa's MCP surface: the questions an agent cannot answer by reading files.
 *
 * ## Why these tools and not the whole CLI
 *
 * An agent with a shell can already run `balsa add`. What it cannot do is know
 * *which* component to add, what the active design system means by "spacing",
 * whether a file it is about to overwrite holds someone's work, or how far a
 * dimension actually reaches into upstream components. Those are the answers
 * Balsa holds and nothing else does, so those are what this exposes.
 *
 * Every tool here reads. Nothing installs, writes, or rewrites, and that is a
 * decision rather than an omission: the write path already has a command whose
 * refusals are its most important behaviour, and `--force` in a shell history is
 * a record of a decision someone made. A tool call that quietly overwrites edited
 * source leaves no such record. `plan_update` therefore reports exactly what
 * `balsa update` would do and stops there.
 *
 * ## Why the protocol is implemented here
 *
 * MCP over stdio is newline-delimited JSON-RPC 2.0 — no framing headers, no
 * handshake beyond `initialize`. The reference SDK would be a runtime dependency
 * of a published CLI, paid by every consumer who installs `balsa-ui` and never
 * runs the server, to save less code than the tool definitions below.
 *
 * The one rule this has to respect: stdout carries protocol messages and nothing
 * else. A stray `console.log` from anything downstream corrupts the stream, so
 * the transport reroutes console output to stderr rather than trusting every
 * library it calls to stay quiet.
 */
import path from "node:path";
import { createInterface } from "node:readline";
import {
  findCatalogItem,
  formatComponentMarkdown,
  kindLabels,
  loadCatalog,
  loadComponentSpec,
  searchCatalog,
  searchKinds,
} from "./agent-context.mjs";
import { listAdapters, loadAdapter } from "./apply-adapters.mjs";
import { describeDesignSystem, formatDesignSystem } from "./design-system-cli.mjs";
import { diffInstalled, diffStateSummary, planUpdate } from "./diff-installed.mjs";
import { detectLocalModifications } from "./install-registry.mjs";
import { formatProblems, inspectInstallation, inspectProject } from "./project-diagnostics.mjs";
import { detectProjectFramework } from "./project-framework.mjs";
import { loadProjectConfiguration } from "./registry-resolve.mjs";

/**
 * Protocol versions this server speaks. A client asking for one of these gets it
 * back; anything else gets the newest, which the specification allows and which
 * beats failing a handshake over a date string.
 */
export const supportedProtocolVersions = ["2025-06-18", "2025-03-26", "2024-11-05"];
export const latestProtocolVersion = supportedProtocolVersions[0];

/** Upstream items Balsa has certified, read from the manifests, never fetched. */
async function certifiedUpstreamItems() {
  const adapters = await listAdapters();
  return adapters.flatMap((adapter) => {
    const match = /^@([a-z0-9-]+)\/(.+)$/.exec(adapter.item ?? "");
    if (!match) return [];
    const [, registry, name] = match;
    return [{
      name,
      title: name,
      category: "component",
      registry: `@${registry}/${name}`,
      description: `Upstream ${registry} component, ${adapter.status.replace(/-/g, " ")}.`,
      status: adapter.status,
      npmDependencies: adapter.requires?.npmDependencies ?? [],
      registryDependencies: [],
    }];
  });
}

const projectArgument = {
  project: {
    type: "string",
    description: "Absolute path to the project. Defaults to the working directory.",
  },
};

const resolveProject = (args) => (args.project ? path.resolve(args.project) : process.cwd());

export const tools = [
  {
    name: "search_components",
    description:
      "Find a Balsa or certified upstream component by what it is for, ranked, with the"
      + " reason each result matched. Use this before writing any common control or"
      + " surface by hand.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: 'What the interface needs to do, e.g. "settings form".' },
        kind: {
          type: "array",
          items: { type: "string", enum: searchKinds },
          description: "Restrict to these kinds of result.",
        },
        limit: { type: "integer", minimum: 1, description: "Maximum results. Defaults to 10." },
        framework: {
          type: "string",
          description: "Restrict to this registry target, for example \"vue\".",
        },
      },
      required: ["query"],
    },
    async handler(args) {
      const query = String(args.query ?? "").trim();
      if (!query) throw new Error("Search for a component purpose or name.");
      const cwd = resolveProject(args);
      const framework = args.framework ?? (await detectProjectFramework(cwd)).framework;
      const results = searchCatalog(await loadCatalog(cwd), query, {
        kinds: args.kind,
        limit: typeof args.limit === "number" ? args.limit : 10,
        framework,
        upstreamItems: await certifiedUpstreamItems(),
      });
      if (!results.length) {
        return `Nothing matched "${query}". Try a broader intent, or a single word.`;
      }
      return results
        .map(({ item, kind, reasons }) => [
          `${item.name}  (${kindLabels[kind]})`,
          item.description ? `  ${item.description}` : undefined,
          reasons.length ? `  matched: ${reasons.join(", ")}` : undefined,
          item.upstream ? `  stands in for ${item.upstream.registry}/${item.upstream.name}` : undefined,
          `  install: npx balsa-ui@latest add ${item.registry ?? item.name}`,
        ].filter(Boolean).join("\n"))
        .join("\n\n");
    },
  },
  {
    name: "component_contract",
    description:
      "The full contract for a Balsa component: purpose, what to use it for and what"
      + " not to, accessibility behaviour, typed props, events, slots, tokens, worked"
      + " examples and known mistakes. Read this instead of guessing an API.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Catalog item name or registry reference, e.g. \"select\" or \"@balsa/select\".",
        },
        framework: {
          type: "string",
          description: "Restrict to this registry target, for example \"vue\".",
        },
      },
      required: ["name"],
    },
    async handler(args) {
      const catalog = await loadCatalog(resolveProject(args));
      const framework = args.framework ?? (await detectProjectFramework(resolveProject(args))).framework;
      const item = findCatalogItem(catalog, args.name, { framework });
      return formatComponentMarkdown(item, await loadComponentSpec(item));
    },
  },
  {
    name: "design_system",
    description:
      "The design system active in a project: its dimensions, the tokens each exposes,"
      + " and how far each one reaches into the adapted upstream components. Ask before"
      + " assuming a dimension can be themed.",
    inputSchema: { type: "object", properties: { ...projectArgument } },
    handler: async (args) => formatDesignSystem(await describeDesignSystem(resolveProject(args))),
  },
  {
    name: "project_status",
    description:
      "What a project is working with: framework, style, aliases, configured registries,"
      + " stylesheet entry, design-system version, everything installed, which files hold"
      + " local edits, and any problem that would make an install go wrong.",
    inputSchema: { type: "object", properties: { ...projectArgument } },
    async handler(args) {
      const cwd = resolveProject(args);
      const diagnosis = await inspectProject(cwd);
      const configuration = await loadProjectConfiguration(cwd);
      const installation = await inspectInstallation(cwd, { loadAdapter, detectLocalModifications });

      const lines = [
        `Project: ${diagnosis.projectRoot}`,
        `Framework: ${diagnosis.framework ?? diagnosis.problems.find((problem) =>
          problem.code === "unknown-framework" || problem.code === "ambiguous-framework"
        )?.code ?? "undetected"}`,
        `Style: ${configuration.style}`,
        `Registries: ${Object.keys(configuration.registries).join(", ")}`,
        `Stylesheet: ${diagnosis.stylesheet ?? "none found"}`,
        installation.designSystemVersion
          ? `Design system: ${installation.designSystemVersion}`
          : "Design system: none recorded",
        `Installed: ${installation.installed.length} items`,
      ];
      // Local edits and outdated adapters mean different things — one is the
      // user's work to preserve, the other is Balsa's adaptation having moved on
      // under untouched source — so they are never merged into one list.
      if (installation.modified.length) {
        lines.push(
          "",
          "Locally modified — these are the user's and must not be overwritten:",
          ...installation.modified.map((entry) => `  ${entry.registry ?? entry.reference} (${entry.state})`),
        );
      }
      if (installation.outdatedAdapters.length) {
        lines.push(
          "",
          "Adapters that moved on since install:",
          ...installation.outdatedAdapters.map(
            (entry) => `  ${entry.registry}: installed as ${entry.installedWith}, now ${entry.available}`,
          ),
        );
      }
      lines.push(
        "",
        diagnosis.problems.length
          ? formatProblems(diagnosis.problems).join("\n")
          : "No problems detected.",
      );
      return lines.join("\n");
    },
  },
  {
    name: "plan_update",
    description:
      "Compare installed component source against what the install wrote and what a"
      + " fresh install would write today, and report what `balsa update` would do with"
      + " each. Reports only — run the CLI to act.",
    inputSchema: {
      type: "object",
      properties: {
        ...projectArgument,
        name: { type: "string", description: "Limit to one installed item." },
      },
    },
    async handler(args) {
      const cwd = resolveProject(args);
      const compared = await diffInstalled(cwd, {
        names: args.name ? [args.name] : [],
        includePatches: false,
      });
      if (!compared.length) {
        return args.name ? "No installed item matched." : "Nothing is installed here.";
      }
      const planned = planUpdate(compared);
      const byReference = new Map(compared.map((entry) => [entry.reference, entry]));
      const lines = planned.map((entry) => {
        const { unresolved } = byReference.get(entry.reference) ?? {};
        return `${entry.action === "update" ? "would update" : "would keep  "} ${entry.reference}`
          + `  [${entry.state}] ${diffStateSummary[entry.state] ?? ""}${unresolved ? ` (${unresolved})` : ""}`;
      });
      const updating = planned.filter((entry) => entry.action === "update").length;
      return [
        ...lines,
        "",
        `${updating} would update, ${planned.length - updating} would be left alone.`,
        "Run `npx balsa-ui@latest update` to apply. Items holding local changes are kept"
        + " unless the user passes --force, which is their decision to make.",
      ].join("\n");
    },
  },
];

export function listTools() {
  return tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

/**
 * Run one tool. A failure comes back as tool content with `isError`, not as a
 * JSON-RPC error: a component that does not exist is a normal answer the model
 * should read and act on, while a protocol error is a transport fault it cannot.
 */
export async function callTool(name, args = {}) {
  // Looked up in the array rather than a map built at load, so the exported
  // list stays the single source of truth for what this server offers.
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) {
    return { content: [{ type: "text", text: `No such tool: ${name}.` }], isError: true };
  }
  try {
    return { content: [{ type: "text", text: await tool.handler(args ?? {}) }] };
  } catch (error) {
    return { content: [{ type: "text", text: error.message }], isError: true };
  }
}

/**
 * Handle one JSON-RPC message. Returns the reply, or `undefined` for a
 * notification — which has no `id` and must never be answered.
 */
export async function handleMessage(message, { serverVersion = "0.0.0" } = {}) {
  const { id, method, params } = message ?? {};
  const isNotification = id === undefined || id === null;
  const reply = (result) => (isNotification ? undefined : { jsonrpc: "2.0", id, result });
  const fail = (code, msg) => (isNotification ? undefined : { jsonrpc: "2.0", id, error: { code, message: msg } });

  switch (method) {
    case "initialize": {
      const requested = params?.protocolVersion;
      return reply({
        protocolVersion: supportedProtocolVersions.includes(requested) ? requested : latestProtocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "balsa-ui", version: serverVersion },
      });
    }
    case "notifications/initialized":
    case "notifications/cancelled":
      return undefined;
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: listTools() });
    case "tools/call":
      return reply(await callTool(params?.name, params?.arguments));
    default:
      return fail(-32601, `Method not found: ${method}`);
  }
}

/**
 * Speak the protocol over stdin and stdout until the client closes the stream.
 *
 * stdout is reserved for protocol messages, so console output is rerouted to
 * stderr for the lifetime of the server. Anything this calls into is free to log
 * without corrupting the transport, which is the only way to keep that guarantee
 * without auditing every library on every change.
 */
export async function serveStdio({
  input = process.stdin,
  output = process.stdout,
  serverVersion,
} = {}) {
  const log = (...values) => process.stderr.write(`${values.join(" ")}\n`);
  console.log = log;
  console.info = log;
  console.warn = log;

  const send = (message) => output.write(`${JSON.stringify(message)}\n`);
  const lines = createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY });

  for await (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let message;
    try {
      message = JSON.parse(trimmed);
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      continue;
    }

    try {
      const reply = await handleMessage(message, { serverVersion });
      if (reply) send(reply);
    } catch (error) {
      // A handler that throws is a bug here, not a bad request. The client is
      // told rather than left waiting on a reply that will never come.
      const id = message?.id;
      if (id !== undefined && id !== null) {
        send({ jsonrpc: "2.0", id, error: { code: -32603, message: error.message } });
      } else {
        log(`balsa mcp: ${error.stack ?? error.message}`);
      }
    }
  }
}
