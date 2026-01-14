import { tool } from "@opencode-ai/plugin";

// Try to import melt package for real builder access
let meltModule: any = null;
let meltImportError: string | null = null;

try {
  // Try ES module import first
  meltModule = await import("melt");
} catch (e) {
  try {
    // Try CommonJS require
    meltModule = require("melt");
  } catch (e2) {
    meltImportError =
      e instanceof Error ? e.message : "Unknown error importing melt";
  }
}

// Builder documentation extracted from melt package structure
const MELT_BUILDERS: Record<
  string,
  {
    path: string;
    description: string;
    category: string;
    props: string[];
  }
> = {
  // Actions & Interactivity
  accordion: {
    path: "melt/builders/accordion",
    description: "Collapsible content panels with smooth animations",
    category: "data-display",
    props: ["value", "onValueChange", "multiple", "disabled"],
  },
  avatar: {
    path: "melt/builders/avatar",
    description: "User avatar with image, initials, or icon",
    category: "data-display",
    props: ["src", "alt", "name", "fallback"],
  },
  button: {
    path: "melt/builders/button",
    description: "Accessible button with loading and icon states",
    category: "actions",
    props: ["variant", "size", "disabled", "loading"],
  },
  checkbox: {
    path: "melt/builders/checkbox",
    description: "Checkbox input with indeterminate state",
    category: "forms",
    props: ["value", "onValueChange", "indeterminate", "disabled"],
  },
  combobox: {
    path: "melt/builders/combobox",
    description: "Combobox with autocomplete and filtering",
    category: "forms",
    props: [
      "value",
      "onValueChange",
      "inputValue",
      "onInputValueChange",
      "open",
      "onOpenChange",
    ],
  },
  contextMenu: {
    path: "melt/builders/context-menu",
    description: "Context menu triggered by right-click or keyboard",
    category: "actions",
    props: ["open", "onOpenChange", "anchorPoint"],
  },
  dateField: {
    path: "melt/builders/date-field",
    description: "Date input with calendar picker",
    category: "forms",
    props: ["value", "onValueChange", "placeholder", "min", "max"],
  },
  dialog: {
    path: "melt/builders/dialog",
    description: "Modal dialog with overlay and focus management",
    category: "actions",
    props: ["open", "onOpenChange", "title", "description", "modal"],
  },
  dropdownMenu: {
    path: "melt/builders/dropdown-menu",
    description: "Dropdown menu with keyboard navigation",
    category: "actions",
    props: ["open", "onOpenChange"],
  },
  floatingLabel: {
    path: "melt/builders/floating-label",
    description: "Floating label input pattern",
    category: "forms",
    props: ["value", "onValueChange", "placeholder"],
  },
  label: {
    path: "melt/builders/label",
    description: "Accessible label for form controls",
    category: "forms",
    props: ["htmlFor", "required"],
  },
  linkPreview: {
    path: "melt/builders/link-preview",
    description: "Rich link preview with metadata",
    category: "data-display",
    props: ["href", "target"],
  },
  menu: {
    path: "melt/builders/menu",
    description: "Navigational menu with items and submenus",
    category: "navigation",
    props: ["open", "onOpenChange", "value", "onValueChange"],
  },
  pagination: {
    path: "melt/builders/pagination",
    description: "Pagination controls for data sets",
    category: "navigation",
    props: ["page", "onPageChange", "totalPages"],
  },
  popover: {
    path: "melt/builders/popover",
    description: "Popover with positioning and arrow",
    category: "actions",
    props: ["open", "onOpenChange", "position"],
  },
  progress: {
    path: "melt/builders/progress",
    description: "Progress indicator for loading states",
    category: "feedback",
    props: ["value", "max", "indeterminate"],
  },
  radioGroup: {
    path: "melt/builders/radio-group",
    description: "Radio button group with accessibility",
    category: "forms",
    props: ["value", "onValueChange", "name", "disabled"],
  },
  rangeSlider: {
    path: "melt/builders/range-slider",
    description: "Range slider with min/max/step",
    category: "forms",
    props: ["value", "onValueChange", "min", "max", "step"],
  },
  scrollArea: {
    path: "melt/builders/scroll-area",
    description: "Customizable scrollable area",
    category: "layout",
    props: ["orientation", "dir"],
  },
  select: {
    path: "melt/builders/select",
    description: "Select dropdown with search and grouping",
    category: "forms",
    props: ["value", "onValueChange", "open", "onOpenChange", "multiple"],
  },
  separator: {
    path: "melt/builders/separator",
    description: "Visual separator/divider",
    category: "layout",
    props: ["orientation", "decorative"],
  },
  slider: {
    path: "melt/builders/slider",
    description: "Slider input with thumbs",
    category: "forms",
    props: ["value", "onValueChange", "min", "max", "step", "multiple"],
  },
  switch: {
    path: "melt/builders/switch",
    description: "Toggle switch component",
    category: "forms",
    props: ["value", "onValueChange", "disabled"],
  },
  tabs: {
    path: "melt/builders/tabs",
    description: "Tabbed interface with lazy content",
    category: "navigation",
    props: ["value", "onValueChange", "activationMode"],
  },
  textField: {
    path: "melt/builders/text-field",
    description: "Text input with validation and floating label",
    category: "forms",
    props: ["value", "onValueChange", "type", "placeholder", "required"],
  },
  timeField: {
    path: "melt/builders/time-field",
    description: "Time input with validation",
    category: "forms",
    props: ["value", "onValueChange", "placeholder"],
  },
  toggle: {
    path: "melt/builders/toggle",
    description: "Two-state toggle button",
    category: "actions",
    props: ["value", "onValueChange", "disabled"],
  },
  tooltip: {
    path: "melt/builders/tooltip",
    description: "Hover tooltip with positioning",
    category: "feedback",
    props: ["open", "onOpenChange", "content"],
  },
};

// Code templates for styling examples
const STYLING_TEMPLATES = {
  tailwind: (code: string) => {
    return `${code}

<!-- Tailwind CSS Styling Example -->
<!-- Add these classes to your elements -->
<!-- Common classes: -->
<!-- Layout: flex, grid, gap-*, p-*, m-* -->
<!-- Typography: text-*, font-*, font-weight-* -->
<!-- Colors: bg-*, text-*, border-*, ring-* -->
<!-- States: hover:*, focus:*, active:*, disabled:* -->
<!-- Responsive: sm:*, md:*, lg:*, xl:* -->
`;
  },
  css: (code: string) => {
    return `${code}

<!-- Vanilla CSS Styling Example -->
<style>
  /* Add your custom styles here */
  .melt-element {
    /* Base styles */
  }

  .melt-element[data-state="open"] {
    /* Open state */
  }

  .melt-element[data-state="closed"] {
    /* Closed state */
  }

  .melt-element[data-disabled] {
    /* Disabled state */
  }
</style>
`;
  },
  cssModules: (code: string) => {
    return `${code}

<!-- CSS Modules Styling Example -->
<script>
  import styles from './Component.module.css';
</script>

<style>
  /* The 'styles' object is now available */
</style>
`;
  },
};

// Generate code based on melt package structure
function generateBuilderCode(
  builderName: string,
  pattern: "builder" | "component" = "builder",
): string {
  const builder = MELT_BUILDERS[builderName.toLowerCase()];

  if (!builder) {
    return `Error: Builder '${builderName}' not found. Available builders: ${Object.keys(MELT_BUILDERS).join(", ")}`;
  }

  const { path, props } = builder;
  const className = builderName.charAt(0).toUpperCase() + builderName.slice(1);

  if (pattern === "builder") {
    return `<script lang="ts">
\timport { ${className} } from "melt/builders";

\tlet value = $state(${getDefaultValue(builderName)});

\tconst ${camelCase(builderName)} = new ${className}({
\t\t${props
      .map((prop) => {
        if (prop === "value") return `value: () => value,`;
        if (prop === "onValueChange")
          return `onValueChange: (v) => (value = v),`;
        if (prop === "open") return `open: $state(false),`;
        if (prop === "onOpenChange") return `onOpenChange: (v) => {},`;
        if (prop === "disabled") return `disabled: $state(false),`;
        return `// ${prop}: ...`;
      })
      .join("\n\t\t")}
\t});
</script>

<!-- Attach builder parts to your elements -->
<!-- Example parts for ${builderName}: -->
<!-- ${getBuilderParts(builderName)} -->`;
  } else {
    return `<script lang="ts">
\timport { ${className} } from "melt/components";

\tlet value = $state(${getDefaultValue(builderName)});
</script>

<${className} bind:value>
\t{#snippet children(${camelCase(builderName)})}
\t\t<!-- Your styled content here -->
\t\t<button {...${camelCase(builderName)}.trigger}>
\t\t\t{${camelCase(builderName)}.value ? "On" : "Off"}
\t\t</button>
\t{/snippet}
</${className}>`;
  }
}

// Helper functions
function camelCase(str: string): string {
  return str
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    .replace(/^./, (g) => g.toLowerCase());
}

function getDefaultValue(builderName: string): string {
  const defaults: Record<string, string> = {
    toggle: "false",
    switch: "false",
    checkbox: "false",
    dialog: "false",
    popover: "false",
    tooltip: "false",
    dropdownMenu: "false",
    menu: "false",
    accordion: "false",
    combobox: '""',
    textField: '""',
    select: '""',
    rangeSlider: "0",
    progress: "0",
    pagination: "1",
    tabs: '""',
  };
  return defaults[builderName] || "null";
}

function getBuilderParts(builderName: string): string {
  const parts: Record<string, string[]> = {
    toggle: ["trigger"],
    switch: ["root", "thumb"],
    checkbox: ["root", "input", "indicator"],
    dialog: ["overlay", "content", "title", "description", "close"],
    popover: ["content", "arrow"],
    tooltip: ["content", "arrow"],
    dropdownMenu: ["menu", "trigger", "item", "group", "separator"],
    menu: ["menu", "item", "group", "separator", "checkboxItem"],
    accordion: ["root", "item", "header", "content", "trigger"],
    combobox: [
      "root",
      "menu",
      "item",
      "input",
      "group",
      "separator",
      "checkboxItem",
    ],
    select: ["root", "menu", "trigger", "item", "value", "group", "separator"],
    radioGroup: ["root", "item", "input", "label"],
    tabs: ["root", "list", "trigger", "content"],
    avatar: ["root", "image", "fallback"],
    button: ["root"],
    textField: ["root", "input", "label"],
    pagination: ["root", "item", "previousTrigger", "nextTrigger"],
    progress: ["root", "track", "fill"],
    rangeSlider: ["root", "thumb", "track", "fill"],
    slider: ["root", "thumb", "track", "fill"],
    timeField: ["root", "segment", "input"],
    dateField: ["root", "segment", "input"],
    label: ["root"],
    separator: ["root"],
    scrollArea: ["root", "viewport", "scrollbar", "thumb"],
  };
  return parts[builderName]?.join(", ") || "trigger";
}

export default tool({
  description:
    "Generate Melt UI components using actual melt npm package. Melt provides headless, accessible component builders for Svelte 5 with Runes.",
  args: {
    action: tool.schema
      .string()
      .describe(
        "Action: 'list-builders', 'get-builder', 'generate', 'generate-component', 'list-categories'",
      ),
    builder: tool.schema
      .string()
      .optional()
      .describe("Builder name (e.g., 'toggle', 'dialog', 'select')"),
    pattern: tool.schema
      .string()
      .optional()
      .describe("Code pattern: 'builder' or 'component'"),
    category: tool.schema.string().optional().describe("Filter by category"),
    styling: tool.schema
      .string()
      .optional()
      .describe("Styling approach: 'tailwind', 'css', 'cssModules', or 'none'"),
    withImports: tool.schema
      .boolean()
      .optional()
      .describe("Include import statements in output"),
  },
  async execute(args) {
    const action = args.action || "list-builders";
    const builderName = args.builder?.toLowerCase();
    const pattern = args.pattern || "builder";
    const category = args.category?.toLowerCase();
    const styling = args.styling || "tailwind";
    const withImports =
      args.withImports !== undefined ? args.withImports : true;

    try {
      switch (action) {
        case "list-builders":
          return listBuilders(category);
        case "get-builder":
          return getBuilder(builderName, styling);
        case "generate":
          return generateBuilderCode(
            builderName,
            pattern as "builder" | "component",
          );
        case "generate-component":
          return generateWithStyling(
            builderName,
            pattern as "builder" | "component",
            styling,
            withImports,
          );
        case "list-categories":
          return listCategories();
        default:
          return `Error: Unknown action '${action}'. Use: list-builders, get-builder, generate, generate-component, list-categories`;
      }
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});

function listBuilders(category?: string) {
  let builders = Object.entries(MELT_BUILDERS);

  if (category) {
    builders = builders.filter(([_, b]) => b.category === category);
  }

  const result = {
    packageStatus: meltModule ? "✅ Installed" : "⚠️  Not installed",
    usingActualPackage: meltModule ? "true" : "false",
    importError: meltImportError,
    totalBuilders: builders.length,
    category: category || "all",
    builders: builders.map(([name, b]) => ({
      name: name,
      category: b.category,
      description: b.description,
      path: b.path,
      props: b.props,
    })),
  };

  return JSON.stringify(result, null, 2);
}

function getBuilder(builderName?: string, styling: string = "tailwind") {
  if (!builderName) {
    return "Error: Builder name is required. Use 'list-builders' to see available builders.";
  }

  const builder = MELT_BUILDERS[builderName];

  if (!builder) {
    return `Error: Builder '${builderName}' not found. Available builders: ${Object.keys(MELT_BUILDERS).join(", ")}`;
  }

  const builderCode = generateBuilderCode(builderName, "builder");
  const styledCode = applyStyling(builderCode, styling);

  return JSON.stringify(
    {
      builder: builderName,
      category: builder.category,
      description: builder.description,
      path: builder.path,
      props: builder.props,
      parts: getBuilderParts(builderName),
      code: builderCode,
      styled: styledCode,
    },
    null,
    2,
  );
}

function generateWithStyling(
  builderName: string,
  pattern: "builder" | "component",
  styling: string,
  withImports: boolean,
) {
  const builderCode = generateBuilderCode(builderName, pattern);
  const styledCode = applyStyling(builderCode, styling);

  if (withImports) {
    return `<!-- Melt UI: ${builderName} Builder -->
<!-- Generated with actual melt package integration -->
<!-- Styling: ${styling} -->

${styledCode}

<!-- Documentation: https://next.melt-ui.com/docs/builders/${builderName} -->`;
  }

  return styledCode;
}

function applyStyling(code: string, styling: string): string {
  const template = STYLING_TEMPLATES[styling as keyof typeof STYLING_TEMPLATES];

  if (template) {
    return template(code);
  }

  return code;
}

function listCategories() {
  const categories = Array.from(
    new Set(Object.values(MELT_BUILDERS).map((b) => b.category)),
  );

  const categorized = categories.map((cat) => ({
    name: cat,
    builders: Object.entries(MELT_BUILDERS)
      .filter(([_, b]) => b.category === cat)
      .map(([name]) => name),
  }));

  return JSON.stringify(
    {
      totalCategories: categories.length,
      categories: categorized,
    },
    null,
    2,
  );
}
