import { describe, test, expect } from "bun:test";
import { Resolver } from "../src/resolver";
import { VersionUtils } from "../src/version-utils";
import { DependencyGraph } from "../src/types";
import type { Agent, Tool } from "../src/types";

const agents: Agent[] = [
  {
    id: "orchestrator",
    name: "orchestrator",
    version: "1.2.0",
    dependencies: [
      { name: "planner", version: "^1.0.0" },
      { name: "web-search", version: ">=2.0.0" },
    ],
  },
  {
    id: "planner",
    name: "planner",
    version: "1.4.2",
    dependencies: [{ name: "web-search", version: "*" }],
  },
  {
    id: "planner-old",
    name: "planner",
    version: "1.1.0",
    dependencies: [],
  },
];

const tools: Tool[] = [
  { name: "web-search", version: "2.3.0", capabilities: ["search"] },
  { name: "web-search", version: "1.0.0", capabilities: ["search"] },
  { name: "file-reader", version: "0.9.1", capabilities: ["read"] },
];

describe("VersionUtils", () => {
  test("parses and compares semver-ish versions", () => {
    expect(VersionUtils.compare("1.2.0", "1.2.0")).toBe(0);
    expect(VersionUtils.compare("2.0.0", "1.9.9")).toBe(1);
    expect(VersionUtils.compare("1.2.3", "1.10.0")).toBe(-1);
  });

  test("evaluates caret and inequality constraints", () => {
    expect(VersionUtils.satisfies("1.4.2", "^1.0.0")).toBe(true);
    expect(VersionUtils.satisfies("2.0.0", "^1.0.0")).toBe(false);
    expect(VersionUtils.satisfies("2.3.0", ">=2.0.0")).toBe(true);
    expect(VersionUtils.satisfies("1.0.0", ">=2.0.0")).toBe(false);
  });
});

describe("DependencyGraph", () => {
  test("records nodes and edges without duplicating nodes", () => {
    const graph = new DependencyGraph();
    const a = graph.addNode("a@1.0.0", "agent", "1.0.0");
    graph.addNode("a@1.0.0", "agent", "1.0.0");
    // addEdge only links nodes that already exist via addNode
    graph.addEdge("a@1.0.0", "b@2.0.0");
    expect(graph.nodes.get("a@1.0.0")!.edges).toHaveLength(0);
    graph.addNode("b@2.0.0", "agent", "2.0.0");
    graph.addEdge("a@1.0.0", "b@2.0.0");
    expect(graph.nodes.get("a@1.0.0")!.edges).toContain("b@2.0.0");
    expect(graph.nodes.size).toBe(2);
    expect(a.edges).toContain("b@2.0.0");
  });
});

describe("Resolver", () => {
  test("resolves an agent tree picking the newest matching versions", () => {
    const result = new Resolver(agents, tools).resolve(["orchestrator"]);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.resolvedAgents.get("orchestrator")).toBe("1.2.0");
    expect(result.resolvedAgents.get("planner")).toBe("1.4.2");
    expect(result.resolvedTools.get("web-search")).toBe("2.3.0");
  });

  test("reports failure for unknown dependencies", () => {
    const lonely: Agent[] = [
      { id: "lonely", name: "lonely", version: "1.0.0", dependencies: [{ name: "ghost", version: "*" }] },
    ];
    const result = new Resolver(lonely, []).resolve(["lonely"]);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes("Dependency not found: ghost"))).toBe(true);
  });

  test("reports failure for unknown root agents", () => {
    const result = new Resolver([], []).resolve(["missing-agent"]);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes("Agent not found: missing-agent"))).toBe(true);
  });
});
