# Playground Example

An interactive playground demonstrating all Gray Design System components, tokens, and patterns. This example serves as a comprehensive reference for exploring and testing the design system's capabilities.

## Page Structure

This playground includes:
- **Interactive Component Showcases**: Buttons, forms, cards, and more
- **Token Displays**: Color palette, typography scale, spacing system
- **Layout Demonstrations**: Grid systems, responsive patterns
- **Component States**: Hover, focus, disabled, and active states
- **Responsive Examples**: Mobile, tablet, and desktop layouts

## Complete Implementation

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>Gray Design System - Playground</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="./style.css" rel="stylesheet">
  <style>
    /* Playground-specific styles */
    .token-swatch {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid rgb(228 228 231 / 1);
      margin-bottom: 0.5rem;
    }
    .token-swatch-color {
      width: 3rem;
      height: 2rem;
      border-radius: 0.125rem;
      margin-right: 0.75rem;
      border: 1px solid rgb(228 228 231 / 1);
    }
    .token-swatch-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: rgb(40 40 40 / 1);
    }
    .token-swatch-value {
      font-size: 0.75rem;
      color: rgb(113 113 122 / 1);
    }
    .playground-section {
      margin-bottom: 4rem;
    }
    .playground-title {
      font-family: 'Inter Tight', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: rgb(40 40 40 / 1);
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgb(228 228 231 / 1);
    }
    .playground-subtitle {
      font-family: 'Inter Tight', sans-serif;
      font-size: 1.125rem;
      font-weight: 600;
      color: rgb(40 40 40 / 1);
      margin-bottom: 1rem;
      margin-top: 1.5rem;
    }
    .component-demo {
      padding: 2rem;
      background: rgb(250 250 250 / 1);
      border-radius: 0.5rem;
      border: 1px solid rgb(228 228 231 / 1);
      margin-bottom: 1.5rem;
    }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
  </style>
</head>

<body class="font-inter antialiased bg-white text-zinc-900 tracking-tight">

  <!-- Page wrapper -->
  <div class="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">

    <!-- Site header -->
    <header class="absolute top-2 md:top-6 w-full z-30" role="banner">
      <div class="px-4 sm:px-6">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between h-14 border border-transparent [background:linear-gradient(var(--color-white),var(--color-white))_padding-box,linear-gradient(120deg,var(--color-zinc-300),var(--color-zinc-100),var(--color-zinc-300))_border-box] rounded-lg px-3">
            
            <!-- Site branding -->
            <div class="shrink-0 mr-4">
              <a class="flex items-center justify-center bg-white w-8 h-8 rounded-sm shadow-xs shadow-zinc-950/20" href="index.html" aria-label="Home">
                <span class="font-inter-tight font-bold text-zinc-900 text-sm">GDS</span>
              </a>
            </div>
            
            <!-- Breadcrumb -->
            <nav class="flex grow" aria-label="Breadcrumb">
              <ol class="flex items-center space-x-2 text-sm text-zinc-500">
                <li>
                  <a class="hover:text-zinc-900 transition" href="index.html">
                    Home
                  </a>
                </li>
                <li>
                  <span>/</span>
                </li>
                <li>
                  <span class="text-zinc-900">Playground</span>
                </li>
              </ol>
            </nav>
            
          </div>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="grow" role="main">
      <section class="relative bg-zinc-50">
        <div class="pt-32 pb-20">
          <div class="max-w-6xl mx-auto px-4 sm:px-6">
            
            <!-- Page header -->
            <div class="max-w-3xl mx-auto text-center pb-12">
              <h1 class="font-inter-tight text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900 pb-4">
                Design System Playground
              </h1>
              <p class="text-lg text-zinc-500">
                Explore and interact with all components, tokens, and patterns from the Gray Design System.
              </p>
            </div>

            <!-- Buttons Section -->
            <div class="playground-section">
              <h2 class="playground-title">Buttons</h2>
              
              <!-- Button Variants -->
              <div class="component-demo">
                <h3 class="playground-subtitle">Button Variants</h3>
                <div class="space-y-4">
                  <div>
                    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
                      Primary Button
                    </button>
                  </div>
                  <div>
                    <button class="btn text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
                      Secondary Button
                    </button>
                  </div>
                  <div>
                    <button class="btn-sm text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
                      Small Primary Button
                    </button>
                  </div>
                  <div>
                    <button class="btn-sm text-zinc-600 bg-white hover:text-zinc-900 shadow-sm">
                      Small Secondary Button
                    </button>
                  </div>
                  <div>
                    <a class="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 py-2 flex items-center transition">
                      Link Style Button
                    </a>
                  </div>
                </div>
              </div>

              <!-- Button States -->
              <div class="component-demo">
                <h3 class="playground-subtitle">Button States</h3>
                <div class="space-y-4">
                  <div>
                    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm">
                      Default State
                    </button>
                  </div>
                  <div>
                    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2">
                      Focus State (Tab to me)
                    </button>
                  </div>
                  <div>
                    <button class="btn text-zinc-400 bg-zinc-100 shadow-sm cursor-not-allowed" disabled>
                      Disabled State
                    </button>
                  </div>
                  <div>
                    <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 shadow-sm w-full">
                      Full Width Button
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Elements Section -->
            <div class="playground-section">
              <h2 class="playground-title">Form Elements</h2>
              
              <div class="demo-grid">
                <!-- Text Inputs -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Text Inputs</h3>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm text-zinc-800 font-medium mb-2" for="text-input">
                        Text Input
                      </label>
                      <input 
                        id="text-input" 
                        class="form-input text-sm w-full" 
                        type="text" 
                        placeholder="Enter text"
                      />
                    </div>
                    <div>
                      <label class="block text-sm text-zinc-800 font-medium mb-2" for="email-input">
                        Email Input
                      </label>
                      <input 
                        id="email-input" 
                        class="form-input text-sm w-full" 
                        type="email" 
                        placeholder="mark@acmecorp.com"
                      />
                    </div>
                    <div>
                      <label class="block text-sm text-zinc-800 font-medium mb-2" for="password-input">
                        Password Input
                      </label>
                      <input 
                        id="password-input" 
                        class="form-input text-sm w-full" 
                        type="password" 
                        placeholder="•••••••••"
                      />
                    </div>
                  </div>
                </div>

                <!-- Select & Textarea -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Select & Textarea</h3>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm text-zinc-800 font-medium mb-2" for="select-input">
                        Select Dropdown
                      </label>
                      <select id="select-input" class="form-select w-full">
                        <option>Option 1</option>
                        <option>Option 2</option>
                        <option>Option 3</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-zinc-800 font-medium mb-2" for="textarea-input">
                        Textarea
                      </label>
                      <textarea 
                        id="textarea-input" 
                        class="form-textarea text-sm w-full" 
                        rows="4" 
                        placeholder="Enter your message"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <!-- Checkboxes & Radios -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Checkboxes & Radios</h3>
                  <div class="space-y-4">
                    <div class="flex items-center">
                      <input 
                        id="checkbox1" 
                        class="form-checkbox" 
                        type="checkbox"
                      />
                      <label for="checkbox1" class="text-sm text-zinc-600 ml-2">
                        Checkbox Option 1
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input 
                        id="checkbox2" 
                        class="form-checkbox" 
                        type="checkbox"
                        checked
                      />
                      <label for="checkbox2" class="text-sm text-zinc-600 ml-2">
                        Checked Checkbox
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input 
                        id="radio1" 
                        class="form-radio" 
                        type="radio" 
                        name="radio-group"
                      />
                      <label for="radio1" class="text-sm text-zinc-600 ml-2">
                        Radio Option 1
                      </label>
                    </div>
                    <div class="flex items-center">
                      <input 
                        id="radio2" 
                        class="form-radio" 
                        type="radio" 
                        name="radio-group"
                        checked
                      />
                      <label for="radio2" class="text-sm text-zinc-600 ml-2">
                        Selected Radio
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Form States -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Form States</h3>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm text-zinc-800 font-medium mb-2" for="focus-input">
                        Focus State
                      </label>
                      <input 
                        id="focus-input" 
                        class="form-input text-sm w-full" 
                        type="text" 
                        placeholder="Tab to see focus"
                      />
                    </div>
                    <div>
                      <label class="block text-sm text-zinc-800 font-medium mb-2" for="error-input">
                        Error State
                      </label>
                      <input 
                        id="error-input" 
                        class="form-input text-sm w-full border-red-500 focus:border-red-500" 
                        type="text" 
                        value="Invalid input"
                      />
                      <p class="text-sm text-red-500 mt-2">
                        Please enter a valid value
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm text-zinc-800 font-medium mb-2" for="disabled-input">
                        Disabled State
                      </label>
                      <input 
                        id="disabled-input" 
                        class="form-input text-sm w-full opacity-50 cursor-not-allowed" 
                        type="text" 
                        placeholder="Disabled field"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cards Section -->
            <div class="playground-section">
              <h2 class="playground-title">Cards</h2>
              
              <div class="demo-grid">
                <!-- Standard Card -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Standard Card</h3>
                  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6">
                    <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Card Title</h3>
                    <p class="text-sm text-zinc-500">Card description text goes here with some content to demonstrate spacing.</p>
                  </div>
                </div>

                <!-- Elevated Card -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Elevated Card</h3>
                  <div class="bg-white border border-zinc-200 rounded-lg shadow-2xl p-6">
                    <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Elevated Card</h3>
                    <p class="text-sm text-zinc-500">This card has a stronger shadow for emphasis.</p>
                  </div>
                </div>

                <!-- Feature Card -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Feature Card</h3>
                  <div class="flex items-start gap-4">
                    <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Feature Title</h3>
                      <p class="text-sm text-zinc-500">Feature description with icon on the left.</p>
                    </div>
                  </div>
                </div>

                <!-- Interactive Card -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Interactive Card</h3>
                  <div class="bg-zinc-100 border border-zinc-200 rounded-lg shadow-sm p-6 hover:border-zinc-400 hover:shadow-md transition cursor-pointer">
                    <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Interactive Card</h3>
                    <p class="text-sm text-zinc-500">Hover over this card to see the effect.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Typography Section -->
            <div class="playground-section">
              <h2 class="playground-title">Typography</h2>
              
              <div class="demo-grid">
                <!-- Headings -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Headings</h3>
                  <div class="space-y-4">
                    <h1 class="font-inter-tight text-4xl font-bold text-zinc-900">Heading 1</h1>
                    <h2 class="font-inter-tight text-3xl font-bold text-zinc-900">Heading 2</h2>
                    <h3 class="font-inter-tight text-2xl font-semibold text-zinc-900">Heading 3</h3>
                    <h4 class="font-inter-tight text-xl font-semibold text-zinc-900">Heading 4</h4>
                    <h5 class="font-inter-tight text-lg font-semibold text-zinc-900">Heading 5</h5>
                    <h6 class="font-inter-tight text-base font-semibold text-zinc-900">Heading 6</h6>
                  </div>
                </div>

                <!-- Body Text -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Body Text</h3>
                  <div class="space-y-4">
                    <p class="text-lg text-zinc-500">Large paragraph text for emphasis and introductions.</p>
                    <p class="text-base text-zinc-900">Standard body text for general content and descriptions.</p>
                    <p class="text-sm text-zinc-500">Small text for secondary information and labels.</p>
                    <p class="text-xs text-zinc-400">Extra small text for captions and metadata.</p>
                  </div>
                </div>

                <!-- Text Styles -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Text Styles</h3>
                  <div class="space-y-4">
                    <p class="text-base text-zinc-900 font-medium">Medium weight text</p>
                    <p class="text-base text-zinc-900 font-semibold">Semibold weight text</p>
                    <p class="text-base text-zinc-900 font-bold">Bold weight text</p>
                    <p class="text-base text-zinc-900 italic">Italic text for emphasis</p>
                    <p class="text-base text-zinc-500 underline">Underlined text for links</p>
                    <p class="font-inter-tight text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-zinc-500 via-zinc-900 to-zinc-900">
                      Gradient text heading
                    </p>
                  </div>
                </div>

                <!-- Tabular Numbers -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Tabular Numbers</h3>
                  <div class="space-y-4">
                    <h4 class="font-inter-tight text-2xl font-bold tabular-nums text-zinc-900">
                      1,234,567
                    </h4>
                    <h4 class="font-inter-tight text-2xl font-bold tabular-nums text-zinc-900">
                      98,765,432
                    </h4>
                    <h4 class="font-inter-tight text-2xl font-bold tabular-nums text-zinc-900">
                      $19.99
                    </h4>
                    <h4 class="font-inter-tight text-2xl font-bold tabular-nums text-zinc-900">
                      42.5%
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            <!-- Color Tokens Section -->
            <div class="playground-section">
              <h2 class="playground-title">Color Tokens</h2>
              
              <div class="demo-grid">
                <!-- Zinc Palette -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Zinc Palette (Primary)</h3>
                  <div>
                    <div class="token-swatch">
                      <div class="token-swatch-color" style="background-color: rgb(250 250 250 / 1);"></div>
                      <div>
                        <div class="token-swatch-name">zinc-50</div>
                        <div class="token-swatch-value">bg-zinc-50</div>
                      </div>
                    </div>
                    <div class="token-swatch">
                      <div class="token-swatch-color" style="background-color: rgb(244 244 245 / 1);"></div>
                      <div>
                        <div class="token-swatch-name">zinc-100</div>
                        <div class="token-swatch-value">bg-zinc-100</div>
                      </div>
                    </div>
                    <div class="token-swatch">
                      <div class="token-swatch-color" style="background-color: rgb(228 228 231 / 1);"></div>
                      <div>
                        <div class="token-swatch-name">zinc-200</div>
                        <div class="token-swatch-value">bg-zinc-200</div>
                      </div>
                    </div>
                    <div class="token-swatch">
                      <div class="token-swatch-color" style="background-color: rgb(212 212 216 / 1);"></div>
                      <div>
                        <div class="token-swatch-name">zinc-300</div>
                        <div class="token-swatch-value">bg-zinc-300</div>
                      </div>
                    </div>
                    <div class="token-swatch">
                      <div class="token-swatch-color" style="background-color: rgb(168 162 158 / 1);"></div>
                      <div>
                        <div class="token-swatch-name">zinc-400</div>
                        <div class="token-swatch-value">bg-zinc-400</div>
                      </div>
                    </div>
                    <div class="token-swatch">
                      <div class="token-swatch-color" style="background-color: rgb(113 113 122 / 1);"></div>
                      <div>
                        <div class="token-swatch-name">zinc-500</div>
                        <div class="token-swatch-value">text-zinc-500</div>
                      </div>
                    </div>
                    <div class="token-swatch">
                      <div class="token-swatch-color" style="background-color: rgb(82 82 91 / 1);"></div>
                      <div>
                        <div class="token-swatch-name">zinc-600</div>
                        <div class="token-swatch-value">text-zinc-600</div>
                      </div>
                    </div>
                    <div class="token-swatch">
                      <div class="token-swatch-color" style="background-color: rgb(63 63 70 / 1);"></div>
                      <div>
                        <div class="token-swatch-name">zinc-700</div>
                        <div class="token-swatch-value">text-zinc-700</div>
                      </div>
                    </div>
                    <div class="token-swatch">
                      <div class="token-swatch-color" style="background-color: rgb(39 39 42 / 1);"></div>
                      <div>
                        <div class="token-swatch-name">zinc-900</div>
                        <div class="token-swatch-value">text-zinc-900</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Semantic Colors -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Semantic Colors</h3>
                  <div class="space-y-3">
                    <button class="btn text-zinc-100 bg-red-500 hover:bg-red-600 shadow-sm">
                      Error Action
                    </button>
                    <button class="btn text-zinc-100 bg-green-500 hover:bg-green-600 shadow-sm">
                      Success Action
                    </button>
                    <button class="btn text-zinc-100 bg-blue-500 hover:bg-blue-600 shadow-sm">
                      Info Action
                    </button>
                    <button class="btn text-zinc-100 bg-amber-500 hover:bg-amber-600 shadow-sm">
                      Warning Action
                    </button>
                  </div>
                </div>

                <!-- Shadows -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Shadows</h3>
                  <div class="space-y-4">
                    <div class="bg-white p-6 rounded-lg shadow-xs shadow-zinc-950/20">
                      shadow-xs (Logo, small elements)
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-sm shadow-zinc-950/20">
                      shadow-sm (Buttons, inputs)
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-2xl shadow-zinc-950/20">
                      shadow-2xl (Cards, hero images)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Layout Grid Section -->
            <div class="playground-section">
              <h2 class="playground-title">Layout Grid</h2>
              
              <!-- Grid Columns -->
              <div class="component-demo">
                <h3 class="playground-subtitle">Grid Columns</h3>
                <div class="space-y-6">
                  <div>
                    <p class="text-sm text-zinc-500 mb-2">Single Column (mobile default)</p>
                    <div class="grid grid-cols-1 gap-4">
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 1</div>
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 2</div>
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 3</div>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm text-zinc-500 mb-2">Two Columns (tablet)</p>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 1</div>
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 2</div>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm text-zinc-500 mb-2">Three Columns (desktop)</p>
                    <div class="grid grid-cols-3 gap-4">
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 1</div>
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 2</div>
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 3</div>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm text-zinc-500 mb-2">Four Columns (large desktop)</p>
                    <div class="grid grid-cols-4 gap-4">
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 1</div>
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 2</div>
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 3</div>
                      <div class="bg-zinc-100 border border-zinc-200 rounded p-4">Item 4</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Grid Spans -->
              <div class="component-demo">
                <h3 class="playground-subtitle">Column Spans (12-column system)</h3>
                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-12 bg-zinc-100 border border-zinc-200 rounded p-4">Span 12 (Full Width)</div>
                  <div class="col-span-6 bg-zinc-100 border border-zinc-200 rounded p-4">Span 6 (1/2)</div>
                  <div class="col-span-6 bg-zinc-100 border border-zinc-200 rounded p-4">Span 6 (1/2)</div>
                  <div class="col-span-4 bg-zinc-100 border border-zinc-200 rounded p-4">Span 4 (1/3)</div>
                  <div class="col-span-4 bg-zinc-100 border border-zinc-200 rounded p-4">Span 4 (1/3)</div>
                  <div class="col-span-4 bg-zinc-100 border border-zinc-200 rounded p-4">Span 4 (1/3)</div>
                  <div class="col-span-3 bg-zinc-100 border border-zinc-200 rounded p-4">Span 3 (1/4)</div>
                  <div class="col-span-3 bg-zinc-100 border border-zinc-200 rounded p-4">Span 3 (1/4)</div>
                  <div class="col-span-3 bg-zinc-100 border border-zinc-200 rounded p-4">Span 3 (1/4)</div>
                  <div class="col-span-3 bg-zinc-100 border border-zinc-200 rounded p-4">Span 3 (1/4)</div>
                </div>
              </div>
            </div>

            <!-- Spacing Section -->
            <div class="playground-section">
              <h2 class="playground-title">Spacing Tokens</h2>
              
              <div class="demo-grid">
                <!-- Padding -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Padding</h3>
                  <div class="space-y-3">
                    <div class="bg-zinc-100 p-1">p-1 (0.25rem)</div>
                    <div class="bg-zinc-100 p-2">p-2 (0.5rem)</div>
                    <div class="bg-zinc-100 p-4">p-4 (1rem)</div>
                    <div class="bg-zinc-100 p-6">p-6 (1.5rem)</div>
                    <div class="bg-zinc-100 p-8">p-8 (2rem)</div>
                  </div>
                </div>

                <!-- Margins -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Margins</h3>
                  <div class="space-y-2">
                    <div class="bg-zinc-100 inline-block">mb-1</div>
                    <div class="bg-zinc-100 inline-block mb-2">mb-2</div>
                    <div class="bg-zinc-100 inline-block mb-4">mb-4</div>
                    <div class="bg-zinc-100 inline-block mb-6">mb-6</div>
                    <div class="bg-zinc-100 inline-block mb-8">mb-8</div>
                  </div>
                </div>

                <!-- Gaps -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Gaps</h3>
                  <div class="space-y-4">
                    <div>
                      <p class="text-sm text-zinc-500 mb-2">gap-2 (0.5rem)</p>
                      <div class="flex gap-2">
                        <div class="bg-zinc-100 p-4">Item 1</div>
                        <div class="bg-zinc-100 p-4">Item 2</div>
                      </div>
                    </div>
                    <div>
                      <p class="text-sm text-zinc-500 mb-2">gap-4 (1rem)</p>
                      <div class="flex gap-4">
                        <div class="bg-zinc-100 p-4">Item 1</div>
                        <div class="bg-zinc-100 p-4">Item 2</div>
                      </div>
                    </div>
                    <div>
                      <p class="text-sm text-zinc-500 mb-2">gap-6 (1.5rem)</p>
                      <div class="flex gap-6">
                        <div class="bg-zinc-100 p-4">Item 1</div>
                        <div class="bg-zinc-100 p-4">Item 2</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Border Radius -->
                <div class="component-demo">
                  <h3 class="playground-subtitle">Border Radius</h3>
                  <div class="space-y-4">
                    <div class="bg-zinc-100 p-4 rounded-none">rounded-none</div>
                    <div class="bg-zinc-100 p-4 rounded-sm">rounded-sm (0.125rem)</div>
                    <div class="bg-zinc-100 p-4 rounded">rounded (0.25rem)</div>
                    <div class="bg-zinc-100 p-4 rounded-md">rounded-md (0.375rem)</div>
                    <div class="bg-zinc-100 p-4 rounded-lg">rounded-lg (0.5rem)</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Complex Example Section -->
            <div class="playground-section">
              <h2 class="playground-title">Complex Patterns</h2>
              
              <!-- Complete Form -->
              <div class="component-demo">
                <h3 class="playground-subtitle">Complete Form Pattern</h3>
                <div class="max-w-[25rem] mx-auto p-6 rounded-lg shadow-2xl bg-linear-to-b from-zinc-100 to-zinc-50/.7 relative before:absolute before:-top-12 before:-left-16 before:w-96 before:h-96 before:bg-zinc-900 before:opacity-[.15] before:rounded-full before:blur-3xl before:-z-10">
                  <form>
                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm text-zinc-800 font-medium mb-2" for="playground-name">
                          Full Name
                        </label>
                        <input 
                          id="playground-name" 
                          class="form-input text-sm w-full" 
                          type="text" 
                          placeholder="Patrick Rossi" 
                        />
                      </div>
                      <div>
                        <label class="block text-sm text-zinc-800 font-medium mb-2" for="playground-email">
                          Work Email
                        </label>
                        <input 
                          id="playground-email" 
                          class="form-input text-sm w-full" 
                          type="email" 
                          placeholder="mark@acmecorp.com" 
                        />
                      </div>
                      <div>
                        <label class="block text-sm text-zinc-800 font-medium mb-2" for="playground-message">
                          Message
                        </label>
                        <textarea 
                          id="playground-message" 
                          class="form-textarea text-sm w-full" 
                          rows="4" 
                          placeholder="Share your thoughts"
                        ></textarea>
                      </div>
                    </div>
                    <div class="mt-5">
                      <button class="btn text-zinc-100 bg-zinc-900 hover:bg-zinc-800 w-full shadow-sm">
                        Send Message
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- Feature Cards Grid -->
              <div class="component-demo">
                <h3 class="playground-subtitle">Feature Cards Grid</h3>
                <div class="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
                  <div class="flex items-start gap-4">
                    <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Lightning Fast</h3>
                      <p class="text-sm text-zinc-500">Optimized for speed and performance.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Secure & Reliable</h3>
                      <p class="text-sm text-zinc-500">Enterprise-grade security and reliability.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="flex items-center justify-center bg-zinc-900 text-zinc-100 w-12 h-12 rounded-sm shrink-0">
                      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-inter-tight font-semibold text-zinc-900 mb-2">Team Collaboration</h3>
                      <p class="text-sm text-zinc-500">Work together seamlessly with your team.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>

    <!-- Site footer -->
    <footer class="border-t border-zinc-200 bg-white py-12" role="contentinfo">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h6 class="text-sm font-semibold text-zinc-900 mb-4">Design System</h6>
            <ul class="space-y-2">
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="index.html">
                  Overview
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#buttons">
                  Components
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="#tokens">
                  Tokens
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h6 class="text-sm font-semibold text-zinc-900 mb-4">Examples</h6>
            <ul class="space-y-2">
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="page-landing.md">
                  Landing Page
                </a>
              </li>
              <li>
                <a class="text-sm text-zinc-500 hover:text-zinc-900 transition" href="page-login.md">
                  Login Page
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>

  </div>

</body>

</html>
```

## Component Categories

### Interactive Components
- **Buttons**: Primary, secondary, small, link-style, with icons
- **States**: Default, hover, focus, disabled, full-width
- **Form Elements**: Text inputs, email, password, select, textarea
- **Form Controls**: Checkboxes, radio buttons, form states
- **Documentation**: [Button Components](../components/button.md), [Form Components](../components/form.md)

### Display Components
- **Cards**: Standard, elevated, feature, interactive
- **Typography**: Headings (H1-H6), body text, text styles
- **Icons**: SVG icons in consistent containers
- **Documentation**: [Card Components](../components/card.md), [Typography Tokens](../tokens/typography.md)

### Visual Tokens
- **Colors**: Zinc palette (50-950), semantic colors
- **Shadows**: xs, sm, 2xl with zinc-950/20 opacity
- **Documentation**: [Color Tokens](../tokens/colors.md)

### Layout Patterns
- **Grids**: Single to four columns, responsive
- **Spans**: 12-column system with various spans
- **Spacing**: Padding, margins, gaps, border radius
- **Documentation**: [Grid System](../layouts/grid.md), [Spacing Tokens](../tokens/spacing.md)

## Interactive Features

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus states visible on Tab navigation
- Proper tab order throughout page

### Visual Feedback
- Hover effects on buttons, cards, and links
- Focus rings on all form inputs
- Transition effects for smooth interactions
- Disabled states for non-interactive elements

### Responsive Behavior
- Grids adapt from 1-4 columns based on viewport
- Padding and spacing scale appropriately
- Mobile-optimized touch targets and spacing
- Desktop-optimized layouts and visual hierarchy

## Token Demonstrations

### Color Palette
- **Zinc Scale**: 50 (lightest) to 950 (darkest)
- **Semantic Colors**: Red (error), green (success), blue (info), amber (warning)
- **Visual Swatches**: Color blocks with names and Tailwind classes
- **Usage**: Backgrounds, text colors, borders, semantic indicators

### Typography Scale
- **Headings**: H1 (text-4xl) to H6 (text-base)
- **Body Text**: Large (text-lg), base (text-base), small (text-sm), extra small (text-xs)
- **Text Styles**: Weights (medium, semibold, bold), italic, underline
- **Special**: Tabular numbers for aligned digits, gradient text

### Spacing System
- **Padding**: 1 (0.25rem) to 8 (2rem)
- **Margins**: 1 (0.25rem) to 8 (2rem)
- **Gaps**: 2 (0.5rem), 4 (1rem), 6 (1.5rem)
- **Border Radius**: none, sm (0.125rem), rounded (0.25rem), md (0.375rem), lg (0.5rem)

## Usage for LLM Agents

When generating new components using this playground as reference:

1. **Reference Token Values**: Use exact colors, typography, and spacing from demonstrated tokens
2. **Follow Component Patterns**: Match button, form, and card class combinations exactly
3. **Apply States Consistently**: Use the same hover, focus, and disabled patterns
4. **Maintain Responsive Behavior**: Follow the mobile-first breakpoint approach
5. **Ensure Accessibility**: Include appropriate ARIA attributes and keyboard navigation
6. **Use Design System Classes**: Never create custom CSS, use only documented Tailwind classes

## Testing Checklist

### Visual Consistency
- [ ] All buttons use correct variant classes
- [ ] Form inputs have consistent styling
- [ ] Cards follow established patterns
- [ ] Colors match zinc palette exactly
- [ ] Typography hierarchy is correct
- [ ] Spacing follows scale values

### Interactive Behavior
- [ ] Hover effects work on all interactive elements
- [ ] Focus states are visible and consistent
- [ ] Disabled states are properly styled
- [ ] Keyboard navigation works throughout
- [ ] Transitions are smooth and consistent

### Responsive Design
- [ ] Grids adapt to breakpoints correctly
- [ ] Mobile layout is optimized
- [ ] Desktop layout takes advantage of space
- [ ] Touch targets are adequate on mobile
- [ ] Text remains readable at all sizes

### Accessibility
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are clearly visible
- [ ] ARIA attributes are appropriate
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader announcements are appropriate

## Related Documentation

- **[Component Index](../components/index.md)**: Complete component reference
- **[Button Components](../components/button.md)**: Button variants and states
- **[Form Components](../components/form.md)**: Form element documentation
- **[Card Components](../components/card.md)**: Card patterns and usage
- **[Color Tokens](../tokens/colors.md)**: Complete color system
- **[Typography Tokens](../tokens/typography.md)**: Typography scale and hierarchy
- **[Spacing Tokens](../tokens/spacing.md)**: Spacing system and values
- **[Grid System](../layouts/grid.md)**: 12-column grid documentation
- **[Layout Patterns](../layouts/patterns.md)**: Common layout patterns

## Customization Guide

### Adding New Components
1. Create component in appropriate category section
2. Use exact class combinations from design system
3. Include all relevant states (hover, focus, disabled)
4. Add responsive classes as needed
5. Ensure accessibility with ARIA attributes

### Adding New Tokens
1. Add token swatch to appropriate section
2. Include token name, visual representation, and class
3. Demonstrate usage in context
4. Update related documentation files

### Modifying Layouts
1. Adjust grid columns and spans using system values
2. Modify spacing using scale values
3. Maintain responsive breakpoint approach
4. Test across all viewport sizes

---

**Note**: This playground demonstrates the complete Gray Design System in an interactive format. All components, tokens, and patterns work together to create a cohesive experience. Use this page as a reference for understanding system capabilities and as a template for generating consistent, accessible, and responsive interfaces.