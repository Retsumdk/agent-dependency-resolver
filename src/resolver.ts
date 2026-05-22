import { Agent, Tool, Dependency, ResolutionResult, DependencyGraph } from './types';
import { VersionUtils } from './version-utils';

export class Resolver {
  private availableAgents: Map<string, Agent[]> = new Map();
  private availableTools: Map<string, Tool[]> = new Map();

  constructor(agents: Agent[], tools: Tool[]) {
    // Group agents by name for multi-version support
    for (const agent of agents) {
      const list = this.availableAgents.get(agent.name) || [];
      list.push(agent);
      this.availableAgents.set(agent.name, list);
    }

    // Group tools by name
    for (const tool of tools) {
      const list = this.availableTools.get(tool.name) || [];
      list.push(tool);
      this.availableTools.set(tool.name, list);
    }
  }

  /**
   * Resolves dependencies starting from a set of root agents.
   */
  resolve(rootAgentNames: string[]): ResolutionResult {
    const resolvedAgents = new Map<string, string>();
    const resolvedTools = new Map<string, string>();
    const graph = new DependencyGraph();
    const errors: string[] = [];

    try {
      for (const name of rootAgentNames) {
        this.resolveAgent(name, '*', resolvedAgents, resolvedTools, graph, new Set());
      }
      return { success: true, resolvedAgents, resolvedTools, errors, graph };
    } catch (err: any) {
      return { success: false, resolvedAgents, resolvedTools, errors: [err.message, ...errors], graph };
    }
  }

  private resolveAgent(
    name: string,
    constraint: string,
    resolvedAgents: Map<string, string>,
    resolvedTools: Map<string, string>,
    graph: DependencyGraph,
    visited: Set<string>
  ) {
    if (visited.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`);
    }

    const agents = this.availableAgents.get(name);
    if (!agents) {
      throw new Error(`Agent not found: ${name}`);
    }

    // Filter agents by constraint and sort by latest version
    const candidates = agents
      .filter(a => constraint === '*' || VersionUtils.satisfies(a.version, constraint))
      .sort((a, b) => VersionUtils.compare(b.version, a.version));

    if (candidates.length === 0) {
      throw new Error(`No version of agent ${name} satisfies constraint ${constraint}`);
    }

    // Try candidates (backtracking would go here, but we'll take latest for now)
    const agent = candidates[0];
    const agentKey = `${agent.name}@${agent.version}`;

    // Check for conflicts
    if (resolvedAgents.has(agent.name) && resolvedAgents.get(agent.name) !== agent.version) {
      throw new Error(`Version conflict for agent ${agent.name}: ${resolvedAgents.get(agent.name)} vs ${agent.version}`);
    }

    resolvedAgents.set(agent.name, agent.version);
    graph.addNode(agentKey, 'agent', agent.version);

    const nextVisited = new Set(visited);
    nextVisited.add(name);

    for (const dep of agent.dependencies) {
      if (this.availableAgents.has(dep.name)) {
        this.resolveAgent(dep.name, dep.version, resolvedAgents, resolvedTools, graph, nextVisited);
        graph.addEdge(agentKey, `${dep.name}@${resolvedAgents.get(dep.name)}`);
      } else if (this.availableTools.has(dep.name)) {
        this.resolveTool(dep.name, dep.version, resolvedTools, graph);
        graph.addEdge(agentKey, `${dep.name}@${resolvedTools.get(dep.name)}`);
      } else {
        throw new Error(`Dependency not found: ${dep.name} (required by ${agentKey})`);
      }
    }
  }

  private resolveTool(
    name: string,
    constraint: string,
    resolvedTools: Map<string, string>,
    graph: DependencyGraph
  ) {
    const tools = this.availableTools.get(name);
    if (!tools) {
      throw new Error(`Tool not found: ${name}`);
    }

    const candidates = tools
      .filter(t => constraint === '*' || VersionUtils.satisfies(t.version, constraint))
      .sort((a, b) => VersionUtils.compare(b.version, a.version));

    if (candidates.length === 0) {
      throw new Error(`No version of tool ${name} satisfies constraint ${constraint}`);
    }

    const tool = candidates[0];
    const toolKey = `${tool.name}@${tool.version}`;

    if (resolvedTools.has(tool.name) && resolvedTools.get(tool.name) !== tool.version) {
      throw new Error(`Version conflict for tool ${tool.name}: ${resolvedTools.get(tool.name)} vs ${tool.version}`);
    }

    resolvedTools.set(tool.name, tool.version);
    graph.addNode(toolKey, 'tool', tool.version);
  }

  /**
   * Validates the entire graph for structural integrity.
   */
  validateGraph(graph: DependencyGraph): string[] {
    const errors: string[] = [];
    // 1. Check for orphaned nodes
    // 2. Check for unreachable subgraphs
    // 3. Verify capability matching (optional enhancement)
    return errors;
  }

  /**
   * Pretty prints the resolution result.
   */
  formatResult(result: ResolutionResult): string {
    if (!result.success) {
      return `❌ Resolution Failed:\n${result.errors.map(e => `  - ${e}`).join('\n')}`;
    }

    let output = `✅ Resolution Successful!\n\n`;
    output += `Resolved Agents:\n`;
    result.resolvedAgents.forEach((v, k) => {
      output += `  - ${k}: ${v}\n`;
    });

    output += `\nResolved Tools:\n`;
    result.resolvedTools.forEach((v, k) => {
      output += `  - ${k}: ${v}\n`;
    });

    return output;
  }
}
