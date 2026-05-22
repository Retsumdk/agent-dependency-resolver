export type Version = string;

export enum ConstraintOperator {
  EQ = "=",
  GT = ">",
  GTE = ">=",
  LT = "<",
  LTE = "<=",
  TILDE = "~",
  CARET = "^",
}

export interface VersionConstraint {
  operator: ConstraintOperator;
  version: Version;
}

export interface Dependency {
  name: string;
  version: string; // Simplified constraint string for now
}

export interface Agent {
  id: string;
  name: string;
  version: Version;
  dependencies: Dependency[];
}

export interface Tool {
  name: string;
  version: Version;
  capabilities: string[];
}

export interface ResolutionResult {
  success: boolean;
  resolvedAgents: Map<string, Version>;
  resolvedTools: Map<string, Version>;
  errors: string[];
  graph: DependencyGraph;
}

export class DependencyGraph {
  nodes: Map<string, Node> = new Map();

  addNode(id: string, type: 'agent' | 'tool', version: string) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, type, version, edges: [] });
    }
    return this.nodes.get(id)!;
  }

  addEdge(fromId: string, toId: string) {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (from && to) {
      from.edges.push(toId);
    }
  }
}

export interface Node {
  id: string;
  type: 'agent' | 'tool';
  version: string;
  edges: string[];
}
