# agent-dependency-resolver

Smart dependency resolution for multi-agent systems, handling conflicting constraints and versioning.

## Overview

The `agent-dependency-resolver` is a core infrastructure component for multi-agent ecosystems. As agents become more specialized and depend on specific tools, skills, or even other agents, resolving the correct versions and ensuring compatibility becomes a complex graph problem.

This library provides a robust resolution engine that handles:
- **Semantic Versioning**: Support for caret (`^`), tilde (`~`), and comparison operators (`>=`, `<=`, `>`, `<`).
- **Conflict Detection**: Identifies when two agents require incompatible versions of the same tool.
- **Circular Dependency Detection**: Prevents infinite loops in agent graphs.
- **Dependency Graph Generation**: Outputs a complete resolution tree for execution planning.

## Features

- **Backtracking Resolver**: (Planned) Intelligent pathfinding for complex constraint satisfaction.
- **Type Safety**: Built with TypeScript for reliable integration.
- **Zero Dependencies**: Core logic is self-contained for maximum portability.
- **Visualization**: Pretty-prints the resolved dependency graph.

## Installation

```bash
git clone https://github.com/Retsumdk/agent-dependency-resolver.git
cd agent-dependency-resolver
```

## Usage

Run the demonstration script to see the resolver in action:

```bash
bun run src/index.ts [agent-name]
```

Example output:
```text
--- Agent Dependency Resolver ---
Target: researcher

✅ Resolution Successful!

Resolved Agents:
  - researcher: 1.0.0
  - summarizer: 0.6.0
  - nlp-core: 1.2.5

Resolved Tools:
  - web-search: 1.2.0
```

## Architecture

### Types
- `Agent`: Represents an autonomous unit with specific dependencies.
- `Tool`: Represents a capability provided to agents.
- `DependencyGraph`: A directed graph structure representing the resolved system.

### Algorithm
The resolver uses a Depth-First Search (DFS) approach to traverse the dependency tree. It maintains a set of `resolvedAgents` and `resolvedTools` to ensure consistency and detect version conflicts early in the process.

## License

MIT License

---

Built by [Retsumdk](https://github.com/Retsumdk)
