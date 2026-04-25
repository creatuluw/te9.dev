import type { DefaultEdgeOptions, ConnectionLineType } from "@xyflow/svelte";
import type {
  BackgroundVariant,
  BackgroundConfig,
  ControlsConfig,
  MiniMapConfig,
} from "../types";

/**
 * Default edge options - smoothstep for curved, readable edges
 */
export const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: "smoothstep",
  animated: false,
};

/**
 * Default connection line type when dragging new connections
 */
export const DEFAULT_CONNECTION_LINE_TYPE = "smoothstep" as ConnectionLineType;

/**
 * Default background configuration
 */
export const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
  variant: "dots",
  patternColor: undefined, // Use default from Svelte Flow
  gap: 16,
  size: 1,
};

/**
 * Default controls configuration
 */
export const DEFAULT_CONTROLS_CONFIG: ControlsConfig = {
  showZoomIn: true,
  showZoomOut: true,
  showFitView: true,
  showLock: false,
};

/**
 * Default minimap configuration
 */
export const DEFAULT_MINIMAP_CONFIG: MiniMapConfig = {
  zoomable: true,
  pannable: true,
  height: 120,
  width: 120,
  maskColor: "rgba(0, 0, 0, 0.1)",
};

/**
 * Default zoom settings
 */
export const DEFAULT_ZOOM = {
  min: 0.25,
  max: 2,
  default: 1,
};

/**
 * Helper to merge default edge options with user options
 */
export function mergeEdgeOptions(
  userOptions?: DefaultEdgeOptions,
): DefaultEdgeOptions {
  return {
    ...DEFAULT_EDGE_OPTIONS,
    ...userOptions,
  };
}

/**
 * Helper to normalize background config (boolean to config object)
 */
export function normalizeBackgroundConfig(
  config?: BackgroundConfig | boolean,
): BackgroundConfig | null {
  if (config === false) return null;
  if (config === true || !config) return DEFAULT_BACKGROUND_CONFIG;
  return { ...DEFAULT_BACKGROUND_CONFIG, ...config };
}

/**
 * Helper to normalize controls config (boolean to config object)
 */
export function normalizeControlsConfig(
  config?: ControlsConfig | boolean,
): ControlsConfig | null {
  if (config === false) return null;
  if (config === true || !config) return DEFAULT_CONTROLS_CONFIG;
  return { ...DEFAULT_CONTROLS_CONFIG, ...config };
}

/**
 * Helper to normalize minimap config (boolean to config object)
 */
export function normalizeMiniMapConfig(
  config?: MiniMapConfig | boolean,
): MiniMapConfig | null {
  if (config === false) return null;
  if (config === true || !config) return DEFAULT_MINIMAP_CONFIG;
  return { ...DEFAULT_MINIMAP_CONFIG, ...config };
}
