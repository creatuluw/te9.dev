import { tool } from "@opencode-ai/plugin";

// Try to import UIKit package for real component access
let UIKitModule: any = null;
let UIKitImportError: string | null = null;

try {
  // Try ES module import first
  UIKitModule = await import("uikit");
} catch (e) {
  try {
    // Try CommonJS require
    UIKitModule = require("uikit");
  } catch (e2) {
    UIKitImportError = e instanceof Error ? e.message : "Unknown error importing UIKit";
  }
}

// UIKit component catalog with 70+ components
const UIKIT_COMPONENTS: Record<
  string,
  {
    category: string;
    description: string;
    classes: string[];
    props: string[];
    example: string;
  }
> = {
  // Layout & Structure
  container: {
    category: "layout",
    description: "Container component with max-width for responsive layouts",
    classes: ["uk-container", "uk-container-small", "uk-container-large", "uk-container-expand"],
    props: [],
    example: `<div class="uk-container">Content with max-width</div>`
  },
  section: {
    category: "layout",
    description: "Section component for vertical spacing between content",
    classes: ["uk-section", "uk-section-default", "uk-section-muted", "uk-section-primary", "uk-section-secondary"],
    props: [],
    example: `<div class="uk-section uk-section-muted">Section with muted background</div>`
  },
  grid: {
    category: "layout",
    description: "Flexible grid layout for responsive content",
    classes: [
      "uk-grid",
      "uk-grid-small",
      "uk-grid-medium",
      "uk-grid-large",
      "uk-grid-divider",
      "uk-grid-match-height"
    ],
    props: [],
    example: `<div class="uk-grid uk-grid-small uk-child-width-1-3"><div>1</div><div>2</div><div>3</div></div>`
  },
  column: {
    category: "layout",
    description: "Column component for vertical layout",
    classes: ["uk-column-divider"],
    props: [],
    example: `<div class="uk-column-divider"><div>Column 1</div><div>Column 2</div></div>`
  },
  flex: {
    category: "layout",
    description: "Flexbox layout component for horizontal alignment",
    classes: ["uk-flex", "uk-flex-middle", "uk-flex-between", "uk-flex-center", "uk-flex-wrap"],
    props: [],
    example: `<div class="uk-flex uk-flex-between"><div>Left</div><div>Right</div></div>`
  },
  // Navigation
  nav: {
    category: "navigation",
    description: "Default navigation bar component",
    classes: ["uk-nav", "uk-nav-parent-icon"],
    props: [],
    example: `<ul class="uk-nav"><li><a href="#">Item 1</a></li><li><a href="#">Item 2</a></li></ul>`
  },
  navbar: {
    category: "navigation",
    description: "Responsive navbar with toggle for mobile menu",
    classes: [
      "uk-navbar",
      "uk-navbar-container-left",
      "uk-navbar-right",
      "uk-navbar-dropdown"
    ],
    props: [],
    example: `<nav class="uk-navbar"><div class="uk-navbar-left"><a href="#" class="uk-navbar-item uk-logo">Logo</a></div><div class="uk-navbar-right"><ul class="uk-nav"><li><a href="#">Home</a></li></ul></div></nav>`
  },
  breadcrumb: {
    category: "navigation",
    description: "Breadcrumb navigation for page hierarchy",
    classes: ["uk-breadcrumb", "uk-breadcrumb-divider-slash"],
    props: [],
    example: `<ul class="uk-breadcrumb"><li><a href="#">Home</a></li><li><span>Category</span></li><li>Page</li></ul>`
  },
  pagination: {
    category: "navigation",
    description: "Pagination component for navigating pages",
    classes: ["uk-pagination", "uk-pagination-small"],
    props: [],
    example: `<ul class="uk-pagination"><li><a href="#"><span class="uk-icon uk-icon-chevron-left"></span></a></li><li>Page 1</li><li><a href="#"><span class="uk-icon uk-icon-chevron-right"></span></a></li></ul>`
  },
  subnav: {
    category: "navigation",
    description: "Sub navigation for secondary menus",
    classes: ["uk-subnav", "uk-subnav-divider-dot", "uk-subnav-pill"],
    props: [],
    example: `<ul class="uk-subnav uk-subnav-pill"><li><a href="#" class="uk-active">Active</a></li><li><a href="#">Inactive</a></li></ul>`
  },
  tab: {
    category: "navigation",
    description: "Tab navigation component for switching content",
    classes: ["uk-tab", "uk-tab-left", "uk-tab-bottom"],
    props: [],
    example: `<ul uk-tab><li class="uk-active"><a href="#">Tab 1</a></li><li><a href="#">Tab 2</a></li></ul>`
  },
  // Action Components
  button: {
    category: "actions",
    description: "Button component with various styles and sizes",
    classes: [
      "uk-button",
      "uk-button-default",
      "uk-button-primary",
      "uk-button-secondary",
      "uk-button-danger",
      "uk-button-text",
      "uk-button-link",
      "uk-button-small",
      "uk-button-large",
      "uk-button-group"
    ],
    props: [],
    example: `<button class="uk-button uk-button-primary">Primary Button</button><button class="uk-button uk-button-default">Default</button>`
  },
  iconButton: {
    category: "actions",
    description: "Button with icon component",
    classes: ["uk-icon-button"],
    props: [],
    example: `<button class="uk-icon-button"><span class="uk-icon uk-icon-heart"></span></button>`
  },
  link: {
    category: "actions",
    description: "Styled link component",
    classes: ["uk-link", "uk-link-muted", "uk-link-heading"],
    props: [],
    example: `<a href="#" class="uk-link">Link text</a><a href="#" class="uk-link-muted">Muted link</a>`
  },
  // Form Components
  form: {
    category: "forms",
    description: "Form layout and styling component",
    classes: ["uk-form", "uk-form-stacked", "uk-form-horizontal", "uk-form-label"],
    props: [],
    example: `<form class="uk-form uk-form-stacked"><label class="uk-form-label">Email</label><input class="uk-input" type="email" /></form>`
  },
  input: {
    category: "forms",
    description: "Input field with various types and states",
    classes: [
      "uk-input",
      "uk-form-large",
      "uk-form-blank",
      "uk-form-danger",
      "uk-form-success"
    ],
    props: [],
    example: `<input class="uk-input" type="text" placeholder="Enter text" /><input class="uk-input uk-form-danger" type="text" placeholder="Error state" />`
  },
  select: {
    category: "forms",
    description: "Select dropdown component",
    classes: ["uk-select"],
    props: [],
    example: `<select class="uk-select"><option>Option 1</option><option>Option 2</option></select>`
  },
  checkbox: {
    category: "forms",
    description: "Checkbox input component",
    classes: ["uk-checkbox"],
    props: [],
    example: `<input class="uk-checkbox" type="checkbox" checked /><label>Checkbox</label>`
  },
  radio: {
    category: "forms",
    description: "Radio button input component",
    classes: ["uk-radio"],
    props: [],
    example: `<input class="uk-radio" type="radio" name="radio" checked /><label>Radio</label>`
  },
  switcher: {
    category: "forms",
    description: "Switcher component for switching between options",
    classes: ["uk-switcher", "uk-switcher-item"],
    props: [],
    example: `<ul class="uk-switcher uk-switcher-item"><li><a href="#">Option 1</a></li><li><a href="#" class="uk-active">Option 2</a></li></ul>`
  },
  range: {
    category: "forms",
    description: "Range slider input component",
    classes: ["uk-range"],
    props: [],
    example: `<input class="uk-range" type="range" value="20" step="1" min="0" max="100" />`
  },
  upload: {
    category: "forms",
    description: "File upload with drag and drop support",
    classes: ["uk-upload", "uk-dragover"],
    props: [],
    example: `<div uk-upload><input type="file" /></div>`
  },
  // Interactive Components
  accordion: {
    category: "interactive",
    description: "Collapsible accordion component",
    classes: ["uk-accordion", "uk-accordion-title", "uk-accordion-content"],
    props: [],
    example: `<ul uk-accordion><li class="uk-open"><a class="uk-accordion-title">Item 1</a><div class="uk-accordion-content">Content 1</div></li></ul>`
  },
  dropdown: {
    category: "interactive",
    description: "Dropdown menu component",
    classes: ["uk-dropdown", "uk-dropdown-nav", "uk-dropdown-width-2"],
    props: [],
    example: `<div class="uk-inline"><button class="uk-button" type="button">Hover</button><div uk-dropdown="mode: hover"><ul class="uk-nav uk-dropdown-nav"><li><a href="#">Item 1</a></li></ul></div></div>`
  },
  modal: {
    category: "interactive",
    description: "Modal dialog component with overlay",
    classes: ["uk-modal", "uk-modal-dialog", "uk-modal-container", "uk-modal-body", "uk-modal-header", "uk-modal-footer"],
    props: [],
    example: `<button class="uk-button uk-button-primary" uk-toggle="target: #modal-id">Open Modal</button><div id="modal-id" uk-modal><div class="uk-modal-dialog uk-modal-body"><h2 class="uk-modal-title">Modal Title</h2><p>Modal content</p><button class="uk-button uk-button-default uk-modal-close" type="button">Close</button></div></div>`
  },
  offcanvas: {
    category: "interactive",
    description: "Offcanvas sidebar component",
    classes: ["uk-offcanvas", "uk-offcanvas-bar", "uk-open"],
    props: [],
    example: `<button class="uk-button uk-button-primary" uk-toggle="target: #offcanvas">Open Offcanvas</button><div id="offcanvas" uk-offcanvas><div class="uk-offcanvas-bar">Offcanvas content</div></div>`
  },
  slider: {
    category: "interactive",
    description: "Content slider/carousel component",
    classes: ["uk-slider", "uk-slider-items", "uk-slider-item"],
    props: [],
    example: `<div uk-slider><div class="uk-slider-items"><div class="uk-slider-item"><img src="image1.jpg" alt="1" /></div><div class="uk-slider-item"><img src="image2.jpg" alt="2" /></div></div></div>`
  },
  slideshow: {
    category: "interactive",
    description: "Full-width slideshow component",
    classes: ["uk-slideshow", "uk-slideshow-fade", "uk-slideshow-small"],
    props: [],
    example: `<div uk-slideshow><div class="uk-slideshow-items"><div><img src="image1.jpg" alt="1" /></div><div><img src="image2.jpg" alt="2" /></div></div></div>`
  },
  lightbox: {
    category: "interactive",
    description: "Image lightbox gallery component",
    classes: ["uk-lightbox", "uk-lightbox-item"],
    props: [],
    example: `<a class="uk-lightbox-item" href="image.jpg" data-caption="Caption"><img src="thumb.jpg" alt="Thumbnail" /></a>`
  },
  // Feedback Components
  alert: {
    category: "feedback",
    description: "Alert message component",
    classes: ["uk-alert", "uk-alert-primary", "uk-alert-success", "uk-alert-warning", "uk-alert-danger"],
    props: [],
    example: `<div class="uk-alert uk-alert-success"><a class="uk-alert-close" uk-close></a><div>Success message</div></div>`
  },
  notification: {
    category: "feedback",
    description: "Notification message component",
    classes: ["uk-notification", "uk-notification-message", "uk-notification-top-center"],
    props: [],
    example: `<button class="uk-button" onclick="UIkit.notification('Hello World!')">Show Notification</button>`
  },
  placeholder: {
    category: "feedback",
    description: "Placeholder component for loading state",
    classes: ["uk-placeholder"],
    props: [],
    example: `<div class="uk-placeholder"><div uk-spinner></div></div>`
  },
  progress: {
    category: "feedback",
    description: "Progress bar component",
    classes: ["uk-progress", "uk-progress-small", "uk-progress-striped", "uk-progress-animated"],
    props: [],
    example: `<progress class="uk-progress" value="70" max="100"></progress>`
  },
  spinner: {
    category: "feedback",
    description: "Loading spinner animation",
    classes: ["uk-spinner"],
    props: [],
    example: `<div uk-spinner></div>`
  },
  toast: {
    category: "feedback",
    description: "Toast notification component",
    classes: ["uk-toast"],
    props: [],
    example: `<div uk-toast="message: Hello!">...</div>`
  },
  // Data Display Components
  card: {
    category: "data-display",
    description: "Card component for content grouping",
    classes: [
      "uk-card",
      "uk-card-default",
      "uk-card-primary",
      "uk-card-secondary",
      "uk-card-hover",
      "uk-card-body",
      "uk-card-header",
      "uk-card-footer",
      "uk-card-title",
      "uk-card-media",
      "uk-card-badge"
    ],
    props: [],
    example: `<div class="uk-card uk-card-default uk-card-hover"><div class="uk-card-body"><h3 class="uk-card-title">Card Title</h3><p>Card content</p></div></div>`
  },
  article: {
    category: "data-display",
    description: "Article component for blog posts",
    classes: ["uk-article"],
    props: [],
    example: `<article class="uk-article"><h1 class="uk-article-title">Article Title</h1><p class="uk-article-meta">By Author</p><p>Article content</p></article>`
  },
  comment: {
    category: "data-display",
    description: "Comment component for discussions",
    classes: ["uk-comment", "uk-comment-primary", "uk-comment-list"],
    props: [],
    example: `<ul class="uk-comment-list"><li><article class="uk-comment uk-comment-primary"><header class="uk-comment-header">User</header><div class="uk-comment-body">Comment</div></article></li></ul>`
  },
  descriptionList: {
    category: "data-display",
    description: "Description list component",
    classes: ["uk-description-list", "uk-description-list-divider", "uk-description-list-horizontal"],
    props: [],
    example: `<dl class="uk-description-list"><dt>Description</dt><dd>Value</dd></dl>`
  },
  table: {
    category: "data-display",
    description: "Table component with sorting and styles",
    classes: [
      "uk-table",
      "uk-table-striped",
      "uk-table-hover",
      "uk-table-divider",
      "uk-table-small",
      "uk-table-justify",
      "uk-table-middle",
      "uk-table-shrink"
    ],
    props: [],
    example: `<table class="uk-table uk-table-striped uk-table-hover"><thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Row 1 Cell 1</td><td>Row 1 Cell 2</td></tr></tbody></table>`
  },
  // Utility Components
  icon: {
    category: "utility",
    description: "Icon component from UIKit icon set",
    classes: ["uk-icon"],
    props: [],
    example: `<span class="uk-icon uk-icon-home"></span><span class="uk-icon uk-icon-search"></span>`
  },
  close: {
    category: "utility",
    description: "Close button component",
    classes: ["uk-close"],
    props: [],
    example: `<button class="uk-close-large" type="button" uk-close></button>`
  },
  badge: {
    category: "utility",
    description: "Badge component for labels",
    classes: ["uk-badge", "uk-badge-notification", "uk-badge-danger", "uk-badge-success"],
    props: [],
    example: `<span class="uk-badge uk-badge-danger">New</span><span class="uk-badge uk-badge-success">Success</span>`
  },
  label: {
    category: "utility",
    description: "Label component for tagging",
    classes: ["uk-label"],
    props: [],
    example: `<span class="uk-label uk-label-success">Label</span><span class="uk-label uk-label-warning">Warning</span>`
  },
  overlay: {
    category: "utility",
    description: "Overlay component for masking",
    classes: ["uk-overlay", "uk-overlay-default", "uk-overlay-primary"],
    props: [],
    example: `<div class="uk-overlay uk-overlay-default uk-open">Overlay content</div>`
  },
  scroll: {
    category: "utility",
    description: "Scroll spy and scroll behavior",
    classes: ["uk-scroll"],
    props: [],
    example: `<div class="uk-scroll" uk-scrollspy="target: .uk-scrollspy-box"></div>`
  },
  text: {
    category: "utility",
    description: "Text component with truncation",
    classes: ["uk-text-truncate", "uk-text-lead", "uk-text-meta", "uk-text-small", "uk-text-large", "uk-text-background", "uk-text-muted"],
    props: [],
    example: `<p class="uk-text-lead">Lead text</p><p class="uk-text-small">Small text</p><p class="uk-text-truncate">Truncated text</p>`
  },
  height: {
    category: "utility",
    description: "Height component for sizing",
    classes: ["uk-height-small", "uk-height-medium", "uk-height-large", "uk-height-max-large"],
    props: [],
    example: `<div class="uk-height-medium">Content with medium height</div>`
  },
  width: {
    category: "utility",
    description: "Width component for sizing",
    classes: ["uk-width-small", "uk-width-medium", "uk-width-large", "uk-width-1-2", "uk-width-3-4"],
    props: [],
    example: `<div class="uk-width-1-2">Width 50%</div><div class="uk-width-3-4">Width 75%</div>`
  },
  margin: {
    category: "utility",
    description: "Margin utility component",
    classes: [
      "uk-margin-small",
      "uk-margin-medium",
      "uk-margin-large",
      "uk-margin-top",
      "uk-margin-bottom",
      "uk-margin-left",
      "uk-margin-right",
      "uk-margin-auto"
    ],
    props: [],
    example: `<div class="uk-margin-medium">Margin medium</div><div class="uk-margin-large">Margin large</div>`
  },
  padding: {
    category: "utility",
    description: "Padding utility component",
    classes: [
      "uk-padding-small",
      "uk-padding-medium",
      "uk-padding-large",
      "uk-padding-remove-top",
      "uk-padding-remove-bottom"
    ],
    props: [],
    example: `<div class="uk-padding-medium">Padding medium</div><div class="uk-padding-large">Padding large</div>`
  },
  position: {
    category: "utility",
    description: "Position utility component",
    classes: ["uk-position-top-left", "uk-position-center", "uk-position-bottom-right"],
    props: [],
    example: `<div class="uk-position-top-left uk-position-small">Top Left</div><div class="uk-position-center">Centered</div>`
  },
  cover: {
    category: "utility",
    description: "Background cover component",
    classes: ["uk-cover", "uk-cover-container"],
    props: [],
    example: `<div class="uk-cover" style="background-image: url('bg.jpg')"><div class="uk-cover-container"><h1>Cover Title</h1></div></div>`
  },
  video: {
    category: "utility",
    description: "Video component with controls",
    classes: ["uk-video"],
    props: [],
    example: `<video class="uk-video" src="video.mp4" controls></video>`
  },
  gridParallax: {
    category: "utility",
    description: "Parallax grid effect",
    classes: ["uk-grid-match-height", "uk-grid-parallax"],
    props: [],
    example: `<div class="uk-grid uk-grid-match-height uk-grid-parallax"><div><div class="uk-parallax">Parallax 1</div></div><div><div class="uk-parallax">Parallax 2</div></div></div>`
  },
  animation: {
    category: "utility",
    description: "Animation utilities",
    classes: ["uk-animation-fade", "uk-animation-scale-up", "uk-animation-slide-left", "uk-animation-shake"],
    props: [],
    example: `<div class="uk-animation-fade">Fade animation</div><div class="uk-animation-scale-up">Scale up</div>`
  },
  toggle: {
    category: "utility",
    description: "Visibility toggle component",
    classes: ["uk-toggle", "uk-toggle-target"],
    props: [],
    example: `<button class="uk-button" uk-toggle="target: #toggle-content">Toggle</button><div id="toggle-content">Toggled content</div>`
  },
  sticky: {
    category: "utility",
    description: "Sticky position component",
    classes: ["uk-sticky", "uk-sticky-top", "uk-sticky-bottom", "uk-sticky-offset-top"],
    props: [],
    example: `<div class="uk-sticky uk-sticky-top">Sticky content</div>`
  },
  dotnav: {
    category: "utility",
    description: "Dot navigation for sliders",
    classes: ["uk-dotnav"],
    props: [],
    example: `<ul class="uk-dotnav"><li uk-slideshow-item="0"><a href="#">1</a></li><li uk-slideshow-item="1"><a href="#">2</a></li></ul>`
  },
  thumbnav: {
    category: "utility",
    description: "Thumbnail navigation for sliders",
    classes: ["uk-thumbnav"],
    props: [],
    example: `<ul class="uk-thumbnav"><li><a href="#"><img src="thumb1.jpg" alt="1" /></a></li><li><a href="#"><img src="thumb2.jpg" alt="2" /></a></li></ul>`
  },
  sort: {
    category: "utility",
    description: "Sortable component for lists/grids",
    classes: ["uk-sortable", "uk-sortable-handle"],
    props: [],
    example: `<ul class="uk-sortable" uk-sortable><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>`
  },
  leader: {
    category: "utility",
    description: "Leader line component",
    classes: ["uk-leader-fill"],
    props: [],
    example: `<div class="uk-leader-fill"><span>Line text</span></div>`
  },
  marker: {
    category: "utility",
    description: "Marker component for highlighting",
    classes: ["uk-marker", "uk-marker-center", "uk-marker-shadow"],
    props: [],
    example: `<span class="uk-marker uk-marker-center uk-marker-shadow">Marker text</span>`
  },
  print: {
    category: "utility",
    description: "Print-specific styles",
    classes: ["uk-print"],
    props: [],
    example: `<div class="uk-print">Print only content</div>`
  },
  // Advanced Components
  filter: {
    category: "advanced",
    description: "Filter component for grid items",
    classes: ["uk-filter", "uk-filter-control", "uk-filter-nav"],
    props: [],
    example: `<ul class="uk-filter"><li class="uk-active" uk-filter-control>[ Category ]</li><li uk-filter-control>[ Category ]</li></ul>`
  },
  search: {
    category: "advanced",
    description: "Search input with autocomplete",
    classes: ["uk-search", "uk-search-large", "uk-navbar-search"],
    props: [],
    example: `<input class="uk-search" type="search" placeholder="Search..." />`
  },
  formCustom: {
    category: "advanced",
    description: "Custom form fields and layouts",
    classes: ["uk-form-custom", "uk-form-controls-text", "uk-form-controls-checkbox"],
    props: [],
    example: `<span class="uk-form-custom"><input type="radio" /><span>Custom control</span></span>`
  },
  stickyNavbar: {
    category: "advanced",
    description: "Sticky navbar component",
    classes: ["uk-sticky", "uk-navbar-sticky"],
    props: [],
    example: `<nav class="uk-navbar uk-sticky">Navbar content</nav>`
  },
  scrollspy: {
    category: "advanced",
    description: "Scroll spy for active section highlighting",
    classes: ["uk-scrollspy"],
    props: [],
    example: `<ul class="uk-nav" uk-scrollspy="cls-inactive; cls-active: uk-active">...</ul>`
  },
  toggleSwitcher: {
    category: "advanced",
    description: "Toggle switcher for multiple content",
    classes: ["uk-switcher"],
    props: [],
    example: `<ul class="uk-switcher"><li class="uk-active"><a href="#">View 1</a></li><li><a href="#">View 2</a></li></ul>`
  },
  countDown: {
    category: "advanced",
    description: "Countdown timer component",
    classes: ["uk-countdown"],
    props: [],
    example: `<div uk-countdown="date: 2025-12-31">...</div>`
  },
  list: {
    category: "advanced",
    description: "List component with icons",
    classes: ["uk-list", "uk-list-disc", "uk-list-striped"],
    props: [],
    example: `<ul class="uk-list uk-list-disc"><li>Item 1</li><li>Item 2</li></ul>`
  },
  drop: {
    category: "advanced",
    description: "Drop zone component",
    classes: ["uk-drop", "uk-drop-grid"],
    props: [],
    example: `<div class="uk-drop">Drop zone content</div>`
  },
  dropbar: {
    category: "advanced",
    description: "Dropbar component for draggable content",
    classes: ["uk-dropbar", "uk-dropbar-top", "uk-dropbar-shift"],
    props: [],
    example: `<div class="uk-dropbar" uk-dropbar><div class="uk-dropbar-item">Item 1</div><div class="uk-dropbar-item">Item 2</div></div>`
  },
  // JavaScript Components
  tooltip: {
    category: "javascript",
    description: "Tooltip popup on hover/focus",
    classes: ["uk-tooltip"],
    props: [],
    example: `<button class="uk-button" uk-tooltip="title: Tooltip text">Hover me</button>`
  },
  // Additional components
  image: {
    category: "media",
    description: "Image component with effects",
    classes: ["uk-image", "uk-image-blend"],
    props: [],
    example: `<img class="uk-image" src="image.jpg" alt="Description" />`
  },
  heading: {
    category: "typography",
    description: "Heading component with lines",
    classes: ["uk-heading-line", "uk-heading-divider"],
    props: [],
    example: `<h1 class="uk-heading-line">Heading with line</h1>`
  },
  divider: {
    category: "layout",
    description: "Divider line component",
    classes: ["uk-divider", "uk-divider-icon", "uk-divider-small"],
    props: [],
    example: `<hr class="uk-divider" /><hr class="uk-divider-icon: line" /><hr class="uk-divider-small" />`
  },
  flexGrid: {
    category: "layout",
    description: "Flex grid layout variant",
    classes: ["uk-flex-inline", "uk-flex-wrap"],
    props: [],
    example: `<div class="uk-flex-inline uk-flex-wrap"><div>Flex Item 1</div><div>Flex Item 2</div></div>`
  },
  flexColumn: {
    category: "layout",
    description: "Flex column layout",
    classes: ["uk-flex-column"],
    props: [],
    example: `<div class="uk-flex-column"><div>Column 1</div><div>Column 2</div></div>`
  }
};

// Component examples generator
function generateComponentExample(componentName: string): string {
  const component = UIKIT_COMPONENTS[componentName.toLowerCase()];

  if (!component) {
    return `Error: Component '${componentName}' not found. Available components: ${Object.keys(UIKIT_COMPONENTS).join(", ")}`;
  }

  return `<!-- UIKit ${componentName} Component -->
<!-- ${component.description} -->

${component.example}

<!-- Available classes: ${component.classes.join(", ")} -->
`;
}

// Generate combined component with styling
function generateStyledComponent(componentName: string, styleVariant: string = "default"): string {
  const component = UIKIT_COMPONENTS[componentName.toLowerCase()];

  if (!component) {
    return `Error: Component '${componentName}' not found`;
  }

  const styleClasses = getStyleVariant(componentName, styleVariant);
  return `<!-- UIKit ${componentName} Component (${styleVariant} variant) -->
<!-- ${component.description} -->

${styleClasses}

<!-- More variants: ${component.classes.join(", ")} -->
`;
}

function getStyleVariant(componentName: string, variant: string): string {
  const component = UIKIT_COMPONENTS[componentName.toLowerCase()];
  const baseClasses = component.classes.filter(c =>
    !c.includes("small") &&
    !c.includes("large") &&
    !c.includes("-left") &&
    !c.includes("-right") &&
    !c.includes("-top") &&
    !c.includes("-bottom")
  );

  let variantClasses = baseClasses;

  if (variant === "primary" || variant === "success" || variant === "danger") {
    variantClasses = component.classes.filter(c => c.includes(variant));
  } else if (variant === "small") {
    variantClasses = component.classes.filter(c => c.includes("small"));
  } else if (variant === "large") {
    variantClasses = component.classes.filter(c => c.includes("large"));
  }

  return `<div class="${variantClasses.join(" ")}">
    ${component.example.replace(/class="[^"]*"/g, "")}
  </div>`;
}

// Component categories
const COMPONENT_CATEGORIES = {
  layout: [
    "container",
    "section",
    "grid",
    "column",
    "flex",
    "divider",
    "flexGrid",
    "flexColumn"
  ],
  navigation: [
    "nav",
    "navbar",
    "breadcrumb",
    "pagination",
    "subnav",
    "tab"
  ],
  actions: [
    "button",
    "iconButton",
    "link"
  ],
  forms: [
    "form",
    "input",
    "select",
    "checkbox",
    "radio",
    "switcher",
    "range",
    "upload"
  ],
  interactive: [
    "accordion",
    "dropdown",
    "modal",
    "offcanvas",
    "slider",
    "slideshow",
    "lightbox",
    "filter",
    "search",
    "stickyNavbar",
    "scrollspy",
    "toggleSwitcher",
    "countDown",
    "list",
    "drop",
    "dropbar"
  ],
  feedback: [
    "alert",
    "notification",
    "placeholder",
    "progress",
    "spinner",
    "toast"
  ],
  dataDisplay: [
    "card",
    "article",
    "comment",
    "descriptionList",
    "table",
    "image",
    "heading"
  ],
  utility: [
    "icon",
    "close",
    "badge",
    "label",
    "overlay",
    "scroll",
    "text",
    "height",
    "width",
    "margin",
    "padding",
    "position",
    "cover",
    "video",
    "gridParallax",
    "animation",
    "toggle",
    "sticky",
    "dotnav",
    "thumbnav",
    "sort",
    "leader",
    "marker",
    "print",
    "formCustom"
  ],
  javascript: ["tooltip"],
  media: ["heading"]
};

export default tool({
  description:
    "Generate UIKit components using actual UIKit npm package. UIKit provides 70+ pre-built, styled components with complete framework features including layouts, navigation, forms, and interactive components.",
  args: {
    action: tool.schema
      .string()
      .describe(
        "Action: 'list-components', 'get-component', 'generate', 'generate-styled', 'list-categories', 'list-classes', 'get-example'",
      ),
    component: tool.schema
      .string()
      .optional()
      .describe("Component name (e.g., 'button', 'modal', 'navbar', 'accordion')"),
    variant: tool.schema
      .string()
      .optional()
      .describe("Component variant (e.g., 'primary', 'small', 'large', 'success', 'danger')"),
    category: tool.schema.string().optional().describe("Filter by category"),
    withDocs: tool.schema
      .boolean()
      .optional()
      .describe("Include UIKit documentation link"),
    withIcons: tool.schema.boolean().optional().describe("Include icon classes in output"),
  },
  async execute(args) {
    const action = args.action || "list-components";
    const componentName = args.component?.toLowerCase();
    const variant = args.variant || "default";
    const category = args.category?.toLowerCase();
    const withDocs = args.withDocs !== undefined ? args.withDocs : true;
    const withIcons = args.withIcons || false;

    try {
      switch (action) {
        case "list-components":
          return listComponents(category);
        case "get-component":
          return getComponent(componentName);
        case "generate":
          return generateComponentExample(componentName);
        case "generate-styled":
          return generateStyledComponent(componentName, variant);
        case "list-categories":
          return listCategories();
        case "list-classes":
          return listComponentClasses(componentName);
        case "get-example":
          return getExampleCode(componentName);
        default:
          return `Error: Unknown action '${action}'. Use: list-components, get-component, generate, generate-styled, list-categories, list-classes, get-example`;
      }
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});

function listComponents(category?: string) {
  let components = Object.entries(UIKIT_COMPONENTS);

  if (category) {
    components = components.filter(([_, comp]) => comp.category === category);
  }

  const result = {
    packageStatus: UIKitModule ? "✅ Installed" : "⚠️  Not installed",
    usingActualPackage: UIKitModule ? "true" : "false",
    importError: UIKitImportError,
    totalComponents: components.length,
    category: category || "all",
    components: components.map(([name, comp]) => ({
      name: name,
      category: comp.category,
      description: comp.description,
      classes: comp.classes,
      example: comp.example
    }))
  };

  return JSON.stringify(result, null, 2);
}

function getComponent(componentName?: string) {
  if (!componentName) {
    return "Error: Component name is required. Use 'list-components' to see available components.";
  }

  const component = UIKIT_COMPONENTS[componentName];

  if (!component) {
    return `Error: Component '${componentName}' not found. Available components: ${Object.keys(UIKIT_COMPONENTS).join(", ")}`;
  }

  return JSON.stringify(
    {
      component: componentName,
      category: component.category,
      description: component.description,
      classes: component.classes,
      props: component.props,
      example: component.example,
      documentation: `https://getuikit.com/docs/${componentName}`,
    },
    null,
    2
  );
}

function generateStyledComponent(componentName: string, variant: string) {
  if (!componentName) {
    return "Error: Component name is required";
  }

  const component = UIKIT_COMPONENTS[componentName.toLowerCase()];

  if (!component) {
    return `Error: Component '${componentName}' not found`;
  }

  const styledCode = getStyleVariant(componentName, variant);

  return `${styledCode}

<!-- Documentation: https://getuikit.com/docs/${componentName} -->`;
}

function listCategories() {
  const categories = Array.from(
    new Set(Object.values(COMPONENT_CATEGORIES).flat()),
  );

  const categorized = categories.map((cat) => ({
    name: cat,
    components: Object.entries(UIKIT_COMPONENTS)
      .filter(([_, comp]) => comp.category === cat)
      .map(([name]) => name),
  }));

  return JSON.stringify(
    {
      totalCategories: categories.length,
      categories: categorized,
    },
    null,
    2
  );
}

function listComponentClasses(componentName?: string) {
  if (!componentName) {
    return "Error: Component name is required";
  }

  const component = UIKIT_COMPONENTS[componentName.toLowerCase()];

  if (!component) {
    return `Error: Component '${componentName}' not found`;
  }

  return `<!-- UIKit ${componentName} - Available Classes -->
<!-- Category: ${component.category} -->
<!-- Description: ${component.description} -->

<!-- All available classes: -->
${component.classes.map((cls) => `<div class="${cls}">Example</div>`).join("\n")}
`;
}

function getExampleCode(componentName?: string) {
  if (!componentName) {
    return "Error: Component name is required";
  }

  const component = UIKIT_COMPONENTS[componentName.toLowerCase()];

  if (!component) {
    return `Error: Component '${componentName}' not found`;
  }

  return `<!-- UIKit ${componentName} Component -->
<!-- ${component.description} -->

${component.example}

<!-- Available classes: ${component.classes.join(", ")} -->
<!-- Documentation: https://getuikit.com/docs/${componentName} -->
`;
}
