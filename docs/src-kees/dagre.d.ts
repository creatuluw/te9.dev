declare module "@dagrejs/dagre" {
  export interface GraphLabel {
    rankdir?: "TB" | "LR" | "BT" | "RL";
    align?: "UL" | "UR" | "DL" | "DR";
    nodesep?: number;
    edgesep?: number;
    ranksep?: number;
    marginx?: number;
    marginy?: number;
    acyclicer?: "greedy";
    ranker?: "network-simplex" | "tight-tree" | "longest-path";
  }

  export interface NodeConfig {
    width: number;
    height: number;
    x?: number;
    y?: number;
  }

  export interface NodeResult {
    width: number;
    height: number;
    x: number;
    y: number;
  }

  export interface EdgeConfig {
    minlen?: number;
    weight?: number;
    width?: number;
    height?: number;
    labelpos?: "l" | "r" | "c";
    labeloffset?: number;
  }

  export class Graph {
    constructor(options?: {
      directed?: boolean;
      multigraph?: boolean;
      compound?: boolean;
    });
    setDefaultEdgeLabel(
      label: string | (() => string) | (() => Record<string, unknown>),
    ): void;
    setGraph(label: GraphLabel): void;
    graph(): GraphLabel;
    setNode(id: string, label: NodeConfig): void;
    node(id: string): NodeResult;
    hasNode(id: string): boolean;
    removeNode(id: string): void;
    nodes(): string[];
    nodeCount(): number;
    setEdge(source: string, target: string, label?: EdgeConfig): void;
    edge(source: string, target: string): EdgeConfig;
    hasEdge(source: string, target: string): boolean;
    removeEdge(source: string, target: string): void;
    edges(): Array<{ v: string; w: string }>;
    edgeCount(): number;
    setParent(child: string, parent: string): void;
    parent(child: string): string | undefined;
  }

  export namespace graphlib {
    export { Graph };
  }

  export function layout(g: Graph): void;
}
