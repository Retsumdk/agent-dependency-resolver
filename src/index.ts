import { Resolver } from './resolver';
import { Agent, Tool } from './types';

// Example Data for demonstration
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'researcher',
    version: '1.0.0',
    dependencies: [
      { name: 'web-search', version: '^1.0.0' },
      { name: 'summarizer', version: '>=0.5.0' }
    ]
  },
  {
    id: '2',
    name: 'summarizer',
    version: '0.6.0',
    dependencies: [
      { name: 'nlp-core', version: '~1.2.0' }
    ]
  },
  {
    id: '3',
    name: 'summarizer',
    version: '0.5.0',
    dependencies: [
      { name: 'nlp-core', version: '1.1.0' }
    ]
  },
  {
    id: '4',
    name: 'nlp-core',
    version: '1.2.5',
    dependencies: []
  },
  {
    id: '5',
    name: 'nlp-core',
    version: '1.1.0',
    dependencies: []
  }
];

const mockTools: Tool[] = [
  {
    name: 'web-search',
    version: '1.2.0',
    capabilities: ['search', 'browse']
  },
  {
    name: 'web-search',
    version: '0.9.0',
    capabilities: ['search']
  }
];

function main() {
  const args = process.argv.slice(2);
  const targetAgent = args[0] || 'researcher';

  console.log(`--- Agent Dependency Resolver ---`);
  console.log(`Target: ${targetAgent}\n`);

  const resolver = new Resolver(mockAgents, mockTools);
  const result = resolver.resolve([targetAgent]);

  console.log(resolver.formatResult(result));

  if (result.success) {
    console.log(`\nDependency Graph Structure:`);
    result.graph.nodes.forEach(node => {
      console.log(`[${node.type.toUpperCase()}] ${node.id}`);
      node.edges.forEach(edge => {
        console.log(`  └── depends on: ${edge}`);
      });
    });
  }
}

main();
