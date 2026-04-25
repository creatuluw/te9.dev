export interface WalkthruSlide {
  id: string;
  type: "title" | "app-flow" | "route";
  route?: string;
  title: string;
  subtitle?: string;
  content?: string;
  icon?: string;
  purpose?: string;
  features?: SlideFeature[];
  problemsSolved?: ProblemSolved[];
  taskAchievements?: string[];
  uiStructure?: UISection[];
}

export interface SlideFeature {
  name: string;
  description: string;
  link: string;
  icon: string;
}

export interface ProblemSolved {
  before: string;
  after: string;
}

export interface UISection {
  type: "card" | "grid" | "kanban" | "heatmap" | "tabs";
  title: string;
  content?: string;
  sections?: UISection[];
}

export interface FlowNode {
  id: string;
  label: string;
  route: string;
  description: string;
  jobs?: string[];
  color?: string;
  position: { x: number; y: number };
  icon?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated: boolean;
}
