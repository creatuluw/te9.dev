import { tool } from "@opencode-ai/plugin"

// daisyUI component categories with available components
const COMPONENT_CATEGORIES = {
  actions: ["button", "dropdown", "fab", "modal", "swap", "theme-controller"],
  dataDisplay: ["accordion", "avatar", "badge", "card", "carousel", "chat-bubble", "collapse", "countdown", "diff", "hover-3d-card", "hover-gallery", "kbd", "list", "stat", "status", "table", "text-rotate", "timeline"],
  navigation: ["breadcrumbs", "dock", "link", "menu", "navbar", "pagination", "steps", "tab"],
  feedback: ["alert", "loading", "progress", "radial-progress", "skeleton", "toast", "tooltip"],
  dataInput: ["calendar", "checkbox", "fieldset", "file-input", "filter", "label", "radio", "range", "rating", "select", "input", "textarea", "toggle", "validator"],
  layout: ["divider", "drawer", "footer", "hero", "indicator", "join", "mask", "stack"],
  mockup: ["browser", "code", "phone", "window"]
}

// Component templates with common patterns
const COMPONENT_TEMPLATES: Record<string, any> = {
  button: {
    basic: `<button class="btn">Button</button>`,
    primary: `<button class="btn btn-primary">Button</button>`,
    secondary: `<button class="btn btn-secondary">Button</button>`,
    accent: `<button class="btn btn-accent">Button</button>`,
    outline: `<button class="btn btn-outline">Button</button>`,
    ghost: `<button class="btn btn-ghost">Button</button>`,
    link: `<button class="btn btn-link">Button</button>`,
    sizes: {
      lg: `<button class="btn btn-lg">Large</button>`,
      md: `<button class="btn btn-md">Medium</button>`,
      sm: `<button class="btn btn-sm">Small</button>`,
      xs: `<button class="btn btn-xs">Extra Small</button>`
    },
    withIcon: `<button class="btn">
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
  Button
</button>`
  },

  card: {
    basic: `<div class="card bg-base-100 w-96 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Card title</h2>
    <p>If a dog chews shoes whose shoes does he choose?</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Buy Now</button>
    </div>
  </div>
</div>`,
    withImage: `<div class="card bg-base-100 w-96 shadow-xl">
  <figure><img src="https://daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg" alt="Shoes" /></figure>
  <div class="card-body">
    <h2 class="card-title">Shoes!</h2>
    <p>If a dog chews shoes whose shoes does he choose?</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Buy Now</button>
    </div>
  </div>
</div>`,
    compact: `<div class="card compact bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Compact card</h2>
    <p>More compact version</p>
  </div>
</div>`,
    horizontal: `<div class="card card-side bg-base-100 shadow-xl">
  <figure><img src="https://daisyui.com/images/stock/photo-1635805737707-575885ab0820.jpg" alt="Movie" /></figure>
  <div class="card-body">
    <h2 class="card-title">New movie is released!</h2>
    <p>Click the button to watch on Youtube.</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Watch</button>
    </div>
  </div>
</div>`
  },

  input: {
    basic: `<input type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />`,
    withLabel: `<label class="form-control w-full max-w-xs">
  <div class="label">
    <span class="label-text">What is your name?</span>
  </div>
  <input type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
</label>`,
    bordered: `<input type="text" placeholder="Border input" class="input input-bordered" />`,
    ghost: `<input type="text" placeholder="Ghost input" class="input input-ghost" />`,
    primary: `<input type="text" placeholder="Primary input" class="input input-primary" />`,
    secondary: `<input type="text" placeholder="Secondary input" class="input input-secondary" />`,
    sizes: {
      lg: `<input type="text" placeholder="Large" class="input input-bordered input-lg w-full max-w-xs" />`,
      md: `<input type="text" placeholder="Medium" class="input input-bordered input-md w-full max-w-xs" />`,
      sm: `<input type="text" placeholder="Small" class="input input-bordered input-sm w-full max-w-xs" />`,
      xs: `<input type="text" placeholder="Extra Small" class="input input-bordered input-xs w-full max-w-xs" />`
    }
  },

  modal: {
    basic: `<!-- Open the modal using ID.showModal() method -->
<button class="btn" onclick="my_modal_1.showModal()">open modal</button>
<dialog id="my_modal_1" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Hello!</h3>
    <p class="py-4">Press ESC key or click the button below to close</p>
    <div class="modal-action">
      <form method="dialog">
        <!-- if there is a button in form, it will close the modal -->
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>`,
    responsive: `<!-- Open the modal using ID.showModal() method -->
<button class="btn" onclick="my_modal_2.showModal()">open modal</button>
<dialog id="my_modal_2" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Hello!</h3>
    <p class="py-4">This modal works with a method too!</p>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>`,
    withAction: `<!-- Open the modal using ID.showModal() method -->
<button class="btn" onclick="my_modal_3.showModal()">open modal</button>
<dialog id="my_modal_3" class="modal">
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
    </form>
    <h3 class="font-bold text-lg">Hello!</h3>
    <p class="py-4">Press ESC key or click outside to close</p>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>`
  },

  alert: {
    info: `<div class="alert alert-info">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  <span>New software update available.</span>
</div>`,
    success: `<div class="alert alert-success">
  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  <span>Your purchase has been confirmed!</span>
</div>`,
    warning: `<div class="alert alert-warning">
  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  <span>Warning: Invalid email address!</span>
</div>`,
    error: `<div class="alert alert-error">
  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  <span>Error! Task failed successfully.</span>
</div>`
  },

  badge: {
    basic: `<div class="badge badge-neutral">neutral</div>
<div class="badge badge-primary">primary</div>
<div class="badge badge-secondary">secondary</div>
<div class="badge badge-accent">accent</div>`,
    outline: `<div class="badge badge-outline">neutral</div>
<div class="badge badge-primary badge-outline">primary</div>
<div class="badge badge-secondary badge-outline">secondary</div>
<div class="badge badge-accent badge-outline">accent</div>`,
    ghost: `<div class="badge badge-ghost">neutral</div>
<div class="badge badge-primary badge-ghost">primary</div>
<div class="badge badge-secondary badge-ghost">secondary</div>
<div class="badge badge-accent badge-ghost">accent</div>`,
    large: `<div class="badge badge-lg badge-neutral">large</div>`,
    sizes: {
      lg: `<div class="badge badge-lg">Large</div>`,
      md: `<div class="badge badge-md">Medium</div>`,
      sm: `<div class="badge badge-sm">Small</div>`,
      xs: `<div class="badge badge-xs">Extra Small</div>`
    }
  },

  progress: {
    basic: `<progress class="progress w-56" value="0" max="100"></progress>`,
    primary: `<progress class="progress progress-primary w-56" value="70" max="100"></progress>`,
    secondary: `<progress class="progress progress-secondary w-56" value="40" max="100"></progress>`,
    accent: `<progress class="progress progress-accent w-56" value="90" max="100"></progress>`,
    colors: `<progress class="progress progress-error w-56" value="10" max="100"></progress>
<progress class="progress progress-warning w-56" value="30" max="100"></progress>
<progress class="progress progress-info w-56" value="50" max="100"></progress>
<progress class="progress progress-success w-56" value="70" max="100"></progress>`,
    striped: `<progress class="progress progress-success w-56" value="40" max="100" style="--progress-bar-stripe-color: #22c55e; --progress-bar-stripe-width: 2rem;"></progress>`,
    indeterminate: `<progress class="progress w-56"></progress>`
  },

  dropdown: {
    basic: `<div class="dropdown">
  <div tabindex="0" role="button" class="btn m-1">Click</div>
  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div>`,
    withButton: `<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="btn m-1">Click</div>
  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div>`,
    hover: `<div class="dropdown dropdown-hover">
  <div tabindex="0" role="button" class="btn m-1">Hover</div>
  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div>`
  },

  navbar: {
    basic: `<div class="navbar bg-base-100">
  <div class="navbar-start">
    <div class="dropdown">
      <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
      </div>
      <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
        <li><a>Item 1</a></li>
        <li><a>Item 2</a></li>
      </ul>
    </div>
    <a class="btn btn-ghost text-xl">daisyUI</a>
  </div>
  <div class="navbar-center hidden lg:flex">
    <ul class="menu menu-horizontal px-1">
      <li><a>Item 1</a></li>
      <li><a>Item 2</a></li>
    </ul>
  </div>
  <div class="navbar-end">
    <a class="btn">Button</a>
  </div>
</div>`,
    centered: `<div class="navbar bg-base-100">
  <div class="navbar-start">
    <a class="btn btn-ghost text-xl">daisyUI</a>
  </div>
  <div class="navbar-center hidden lg:flex">
    <ul class="menu menu-horizontal px-1">
      <li><a>Item 1</a></li>
      <li><a>Item 2</a></li>
    </ul>
  </div>
  <div class="navbar-end">
    <a class="btn">Button</a>
  </div>
</div>`,
    withDropdown: `<div class="navbar bg-base-100">
  <div class="navbar-start">
    <a class="btn btn-ghost text-xl">daisyUI</a>
  </div>
  <div class="navbar-center flex">
    <ul class="menu menu-horizontal px-1">
      <li>
        <details>
          <summary>Parent</summary>
          <ul class="p-2">
            <li><a>Submenu 1</a></li>
            <li><a>Submenu 2</a></li>
          </ul>
        </details>
      </li>
      <li><a>Item 3</a></li>
    </ul>
  </div>
  <div class="navbar-end">
    <button class="btn btn-ghost btn-circle">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    </button>
  </div>
</div>`
  },

  tabs: {
    basic: `<div role="tablist" class="tabs tabs-lifted">
  <a role="tab" class="tab">Tab 1</a>
  <a role="tab" class="tab tab-active">Tab 2</a>
  <a role="tab" class="tab">Tab 3</a>
</div>`,
    bordered: `<div role="tablist" class="tabs tabs-boxed">
  <a role="tab" class="tab">Tab 1</a>
  <a role="tab" class="tab tab-active">Tab 2</a>
  <a role="tab" class="tab">Tab 3</a>
</div>`,
    lifted: `<div role="tablist" class="tabs tabs-lifted tabs-lg">
  <input type="radio" name="my_tabs_2" role="tab" class="tab" aria-label="Tab 1" />
  <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">Tab 1 content</div>

  <input type="radio" name="my_tabs_2" role="tab" class="tab" aria-label="Tab 2" checked="checked" />
  <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">Tab 2 content</div>
</div>`
  },

  avatar: {
    basic: `<div class="avatar">
  <div class="w-24 rounded">
    <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
  </div>
</div>`,
    withPlaceholder: `<div class="avatar placeholder">
  <div class="bg-neutral text-neutral-content rounded-full w-24">
    <span class="text-3xl">D</span>
  </div>
</div>`,
    online: `<div class="avatar online">
  <div class="w-24 rounded">
    <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
  </div>
</div>`,
    offline: `<div class="avatar offline">
  <div class="w-24 rounded">
    <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
  </div>
</div>`,
    group: `<div class="avatar-group -space-x-6 rtl:space-x-reverse">
  <div class="avatar">
    <div class="w-12">
      <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
    </div>
  </div>
  <div class="avatar">
    <div class="w-12">
      <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
    </div>
  </div>
  <div class="avatar placeholder">
    <div class="w-12 bg-neutral text-neutral-content">
      <span>+99</span>
    </div>
  </div>
</div>`
  },

  stat: {
    basic: `<div class="stat">
  <div class="stat-figure text-primary">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  </div>
  <div class="stat-title">Total Page Views</div>
  <div class="stat-value text-primary">89.4K</div>
  <div class="stat-desc">21% more than last month</div>
</div>`,
    vertical: `<div class="stat place-items-center">
  <div class="stat-title">Downloads</div>
  <div class="stat-value">31K</div>
  <div class="stat-desc">Jan 1st - Feb 1st</div>
</div>`,
    withDesc: `<div class="stat shadow">
  <div class="stat-figure text-secondary">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  </div>
  <div class="stat-title">Current Users</div>
  <div class="stat-value text-secondary">12.1K</div>
  <div class="stat-desc text-secondary">↗︎ 400 (22%)</div>
</div>`
  },

  accordion: {
    basic: `<div class="collapse collapse-arrow bg-base-200">
  <input type="radio" name="my-accordion-2" checked="checked" />
  <div class="collapse-title text-xl font-medium">
    Click to open this one and close others
  </div>
  <div class="collapse-content">
    <p>hello</p>
  </div>
</div>
<div class="collapse collapse-arrow bg-base-200">
  <input type="radio" name="my-accordion-2" />
  <div class="collapse-title text-xl font-medium">
    Click to open this one and close others
  </div>
  <div class="collapse-content">
    <p>hello</p>
  </div>
</div>
<div class="collapse collapse-arrow bg-base-200">
  <input type="radio" name="my-accordion-2" />
  <div class="collapse-title text-xl font-medium">
    Click to open this one and close others
  </div>
  <div class="collapse-content">
    <p>hello</p>
  </div>
</div>`,
    bordered: `<div class="collapse collapse-plus bg-base-200">
  <input type="radio" name="my-accordion-3" />
  <div class="collapse-title text-xl font-medium">
    Click to open this one and close others
  </div>
  <div class="collapse-content">
    <p>hello</p>
  </div>
</div>
<div class="collapse collapse-plus bg-base-200">
  <input type="radio" name="my-accordion-3" />
  <div class="collapse-title text-xl font-medium">
    Click to open this one and close others
  </div>
  <div class="collapse-content">
    <p>hello</p>
  </div>
</div>`
  },

  table: {
    basic: `<table class="table">
  <!-- head -->
  <thead>
    <tr>
      <th>
        <label>
          <input type="checkbox" class="checkbox" />
        </label>
      </th>
      <th>Name</th>
      <th>Job</th>
      <th>Favorite Color</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <!-- row 1 -->
    <tr>
      <th>
        <label>
          <input type="checkbox" class="checkbox" />
        </label>
      </th>
      <td>Cy Ganderton</td>
      <td>Quality Control Specialist</td>
      <td>Blue</td>
      <th>
        <button class="btn btn-ghost btn-xs">details</button>
      </th>
    </tr>
    <!-- row 2 -->
    <tr>
      <th>
        <label>
          <input type="checkbox" class="checkbox" />
        </label>
      </th>
      <td>Hart Hagerty</td>
      <td>Desktop Support Technician</td>
      <td>Purple</td>
      <th>
        <button class="btn btn-ghost btn-xs">details</button>
      </th>
    </tr>
  </tbody>
</table>`,
    striped: `<table class="table table-zebra">
  <!-- head -->
  <thead>
    <tr>
      <th>Name</th>
      <th>Job</th>
      <th>company</th>
      <th>Favorite Color</th>
    </tr>
  </thead>
  <tbody>
    <!-- row 1 -->
    <tr>
      <td>Cy Ganderton</td>
      <td>Quality Control Specialist</td>
      <td>Littel, Schaden and Vandervort</td>
      <td>Blue</td>
    </tr>
    <!-- row 2 -->
    <tr>
      <td>Hart Hagerty</td>
      <td>Desktop Support Technician</td>
      <td>Zemlak, Daniel and Leannon</td>
      <td>Purple</td>
    </tr>
  </tbody>
</table>`
  },

  loading: {
    spinner: `<span class="loading loading-spinner"></span>`,
    dots: `<span class="loading loading-dots"></span>`,
    ring: `<span class="loading loading-ring"></span>`,
    ball: `<span class="loading loading-ball"></span>`,
    bars: `<span class="loading loading-bars"></span>`,
    sizes: {
      lg: `<span class="loading loading-spinner loading-lg"></span>`,
      md: `<span class="loading loading-spinner loading-md"></span>`,
      sm: `<span class="loading loading-spinner loading-sm"></span>`,
      xs: `<span class="loading loading-spinner loading-xs"></span>`
    }
  },

  toast: {
    basic: `<div class="toast">
  <div class="alert alert-info">
    <span>New message arrived.</span>
  </div>
</div>`,
    withAction: `<div class="toast toast-end">
  <div class="alert alert-success">
    <span>Message sent successfully.</span>
  </div>
  <div class="alert alert-warning">
    <span>Message has been deleted.</span>
  </div>
</div>`,
    center: `<div class="toast toast-center">
  <div class="alert alert-error">
    <span>Error! Task failed successfully.</span>
  </div>
</div>`
  },

  tooltip: {
    basic: `<div class="tooltip" data-tip="hello">
  <button class="btn">Hover me</button>
</div>`,
    top: `<div class="tooltip tooltip-top" data-tip="top">
  <button class="btn">Top</button>
</div>`,
    bottom: `<div class="tooltip tooltip-bottom" data-tip="bottom">
  <button class="btn">Bottom</button>
</div>`,
    left: `<div class="tooltip tooltip-left" data-tip="left">
  <button class="btn">Left</button>
</div>`,
    right: `<div class="tooltip tooltip-right" data-tip="right">
  <button class="btn">Right</button>
</div>`
  },

  skeleton: {
    basic: `<div class="flex w-52 flex-col gap-4">
  <div class="skeleton h-32 w-full"></div>
  <div class="skeleton h-4 w-28"></div>
  <div class="skeleton h-4 w-full"></div>
  <div class="skeleton h-4 w-full"></div>
</div>`,
    avatar: `<div class="flex items-center gap-4">
  <div class="skeleton h-16 w-16 shrink-0 rounded-full"></div>
  <div class="flex flex-col gap-1">
    <div class="skeleton h-4 w-32"></div>
    <div class="skeleton h-4 w-24"></div>
  </div>
</div>`,
    paragraph: `<div class="space-y-3">
  <div class="skeleton h-6 w-full"></div>
  <div class="skeleton h-4 w-5/6"></div>
  <div class="skeleton h-4 w-4/6"></div>
  <div class="skeleton h-4 w-3/6"></div>
</div>`
  },

  select: {
    basic: `<select class="select select-bordered w-full max-w-xs">
  <option disabled selected>Who shot first?</option>
  <option>Han Solo</option>
  <option>Greedo</option>
</select>`,
    primary: `<select class="select select-primary w-full max-w-xs">
  <option disabled selected>Favorite superhero</option>
  <option>Batman</option>
  <option>Superman</option>
  <option>WonderWoman</option>
  <option>Flash</option>
</select>`,
    secondary: `<select class="select select-secondary w-full max-w-xs">
  <option disabled selected>Favorite movie</option>
  <option>Star Wars</option>
  <option>Back to the Future</option>
  <option>Ghostbusters</option>
</select>`,
    sizes: {
      lg: `<select class="select select-bordered select-lg w-full max-w-xs">
  <option disabled selected>Who shot first?</option>
  <option>Han Solo</option>
  <option>Greedo</option>
</select>`,
      md: `<select class="select select-bordered select-md w-full max-w-xs">
  <option disabled selected>Who shot first?</option>
  <option>Han Solo</option>
  <option>Greedo</option>
</select>`,
      sm: `<select class="select select-bordered select-sm w-full max-w-xs">
  <option disabled selected>Who shot first?</option>
  <option>Han Solo</option>
  <option>Greedo</option>
</select>`,
      xs: `<select class="select select-bordered select-xs w-full max-w-xs">
  <option disabled selected>Who shot first?</option>
  <option>Han Solo</option>
  <option>Greedo</option>
</select>`
    }
  },

  checkbox: {
    basic: `<input type="checkbox" class="checkbox checkbox-primary" />`,
    withLabel: `<label class="cursor-pointer label">
  <span class="label-text">Remember me</span>
  <input type="checkbox" checked="checked" class="checkbox checkbox-primary" />
</label>`,
    sizes: {
      lg: `<input type="checkbox" class="checkbox checkbox-lg checkbox-primary" />`,
      md: `<input type="checkbox" class="checkbox checkbox-md checkbox-primary" />`,
      sm: `<input type="checkbox" class="checkbox checkbox-sm checkbox-primary" />`,
      xs: `<input type="checkbox" class="checkbox checkbox-xs checkbox-primary" />`
    }
  },

  radio: {
    basic: `<input type="radio" name="radio-1" class="radio" checked />`,
    withLabel: `<label class="cursor-pointer label">
  <span class="label-text">Red</span>
  <input type="radio" name="radio-2" class="radio radio-primary" checked />
</label>`,
    sizes: {
      lg: `<input type="radio" name="radio-3" class="radio radio-lg" checked />`,
      md: `<input type="radio" name="radio-4" class="radio radio-md" checked />`,
      sm: `<input type="radio" name="radio-5" class="radio radio-sm" checked />`,
      xs: `<input type="radio" name="radio-6" class="radio radio-xs" checked />`
    }
  },

  range: {
    basic: `<input type="range" min="0" max="100" value="40" class="range" />`,
    steps: `<input type="range" min="0" max="100" value="40" class="range range-xs" step="25" />`,
    primary: `<input type="range" min="0" max="100" value="40" class="range range-primary" />`,
    withMark: `<div class="form-control">
  <label class="label"><span class="label-text">Your experience</span></label>
  <div class="form-control w-full max-w-xs">
    <input type="range" min="0" max="100" value="40" class="range range-primary" />
    <div class="w-full flex justify-between text-xs px-2">
      <span>0</span>
      <span>25</span>
      <span>50</span>
      <span>75</span>
      <span>100</span>
    </div>
  </div>
</div>`
  },

  toggle: {
    basic: `<input type="checkbox" class="toggle toggle-primary" />`,
    withLabel: `<label class="cursor-pointer label">
  <span class="label-text">Airplane mode</span>
  <input type="checkbox" class="toggle toggle-primary" />
</label>`,
    sizes: {
      lg: `<input type="checkbox" class="toggle toggle-lg toggle-primary" />`,
      md: `<input type="checkbox" class="toggle toggle-md toggle-primary" />`,
      sm: `<input type="checkbox" class="toggle toggle-sm toggle-primary" />`,
      xs: `<input type="checkbox" class="toggle toggle-xs toggle-primary" />`
    }
  },

  rating: {
    basic: `<div class="rating">
  <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" />
  <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" />
  <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" />
  <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" />
  <input type="radio" name="rating-2" class="mask mask-star-2 bg-orange-400" checked />
</div>`,
    half: `<div class="rating rating-half">
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-1 bg-orange-400" />
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-2 bg-orange-400" />
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-1 bg-orange-400" />
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-2 bg-orange-400" />
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-1 bg-orange-400" />
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-2 bg-orange-400" />
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-1 bg-orange-400" />
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-2 bg-orange-400" />
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-1 bg-orange-400" />
  <input type="radio" name="rating-10" class="mask mask-star-2 mask-half-2 bg-orange-400" checked />
</div>`,
    readonly: `<div class="rating rating-lg rating-half">
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-1 bg-orange-400" checked disabled />
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-2 bg-orange-400" checked disabled />
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-1 bg-orange-400" checked disabled />
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-2 bg-orange-400" checked disabled />
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-1 bg-orange-400" disabled />
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-2 bg-orange-400" disabled />
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-1 bg-orange-400" disabled />
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-2 bg-orange-400" disabled />
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-1 bg-orange-400" disabled />
  <input type="radio" name="rating-3" class="mask mask-star-2 mask-half-2 bg-orange-400" disabled />
</div>`
  },

  timeline: {
    basic: `<ul class="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
  <li>
    <div class="timeline-middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>
    </div>
    <div class="timeline-start md:text-end mb-10">
      <time class="font-mono italic">1984</time>
      <div class="text-lg font-black">First Macintosh</div>
      The Apple Macintosh—later retroactively renamed to the Macintosh 128K—was the original Apple Macintosh personal computer.
    </div>
    <hr/>
  </li>
  <li>
    <hr/>
    <div class="timeline-middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>
    </div>
    <div class="timeline-end mb-10">
      <time class="font-mono italic">1998</time>
      <div class="text-lg font-black">iMac</div>
      iMac is a family of all-in-one Macintosh desktop computers designed and built by Apple Inc.
    </div>
    <hr/>
  </li>
  <li>
    <hr/>
    <div class="timeline-middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>
    </div>
    <div class="timeline-start md:text-end mb-10">
      <time class="font-mono italic">2001</time>
      <div class="text-lg font-black">iPod</div>
      The iPod is a discontinued series of portable media players and multi-purpose mobile devices designed and marketed by Apple Inc.
    </div>
  </li>
</ul>`,
    horizontal: `<ul class="timeline timeline-horizontal timeline-compact">
  <li>
    <div class="timeline-middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>
    </div>
    <div class="timeline-start timeline-box">First Macintosh</div>
    <hr/>
  </li>
  <li>
    <hr/>
    <div class="timeline-middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>
    </div>
    <div class="timeline-end timeline-box">iMac</div>
    <hr/>
  </li>
  <li>
    <hr/>
    <div class="timeline-middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>
    </div>
    <div class="timeline-end timeline-box">iPod</div>
  </li>
</ul>`
  },

  drawer: {
    basic: `<div class="drawer">
  <input id="my-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <!-- Page content here -->
    <label for="my-drawer" class="btn btn-primary drawer-button">Open drawer</label>
  </div>
  <div class="drawer-side">
    <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      <!-- Sidebar content here -->
      <li><a>Sidebar Item 1</a></li>
      <li><a>Sidebar Item 2</a></li>
    </ul>
  </div>
</div>`,
    end: `<div class="drawer drawer-end">
  <input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <!-- Page content here -->
    <label for="my-drawer-4" class="drawer-button btn btn-primary">Open drawer</label>
  </div>
  <div class="drawer-side">
    <label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
    <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      <!-- Sidebar content here -->
      <li><a>Sidebar Item 1</a></li>
      <li><a>Sidebar Item 2</a></li>
    </ul>
  </div>
</div>`,
    responsive: `<div class="drawer lg:drawer-open">
  <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <div class="w-full navbar bg-base-300">
      <div class="flex-none lg:hidden">
        <label for="my-drawer-2" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
      </div>
      <div class="flex-1 px-2 mx-2">Navbar Title</div>
    </div>
    <!-- Page content here -->
    <label for="my-drawer-2" class="btn btn-primary drawer-button lg:hidden">Open drawer</label>
  </div>
  <div class="drawer-side">
    <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
    <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      <!-- Sidebar content here -->
      <li><a>Sidebar Item 1</a></li>
      <li><a>Sidebar Item 2</a></li>
    </ul>
  </div>
</div>`
  },

  hero: {
    basic: `<div class="hero min-h-screen bg-base-200">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">Hello there</h1>
      <p class="py-6">Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a id nisi.</p>
      <button class="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>`,
    withImage: `<div class="hero min-h-screen bg-base-200">
  <div class="hero-content flex-col lg:flex-row-reverse">
    <img src="https://daisyui.com/images/stock/photo-1635805737707-575885ab0820.jpg" class="max-w-sm rounded-lg shadow-2xl" />
    <div>
      <h1 class="text-5xl font-bold">Box Office News!</h1>
      <p class="py-6">Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a id nisi.</p>
      <button class="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>`,
    overlay: `<div class="hero min-h-screen" style="background-image: url(https://daisyui.com/images/stock/photo-1507358522600-9f71e620c44e?w=1920&q=80);">
  <div class="hero-overlay bg-opacity-60"></div>
  <div class="hero-content text-center text-neutral-content">
    <div class="max-w-md">
      <h1 class="mb-5 text-5xl font-bold">Hello there</h1>
      <p class="mb-5">Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a id nisi.</p>
      <button class="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>`
  },

  footer: {
    basic: `<footer class="footer p-10 bg-base-200 text-base-content">
  <aside>
    <svg width="50" height="50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" class="fill-current"><path d="M22.672 15.226l-2.432.811.841 2.515c.33 1.019-.209 2.127-1.23 2.456-1.15.325-2.148-.321-2.463-1.226l-.84-2.518-5.013 1.677.84 2.517c.391 1.203-.434 2.542-1.831 2.542-.88 0-1.601-.564-1.86-1.314l-.842-2.516-2.431.809c-1.135.328-2.145-.317-2.463-1.229-.329-1.018.211-2.127 1.231-2.456l2.432-.809-1.621-4.823-2.432.808c-1.355.384-2.558-.59-2.558-1.839 0-.817.509-1.582 1.327-1.846l2.433-.809-.842-2.515c-.33-1.02.211-2.129 1.232-2.458 1.02-.329 2.13.209 2.461 1.229l.842 2.515 5.011-1.677-.839-2.517c-.403-1.238.484-2.553 1.843-2.553.819 0 1.585.509 1.85 1.326l.841 2.517 2.431-.81c1.02-.33 2.131.211 2.461 1.229.332 1.018-.21 2.126-1.23 2.456l-2.433.809 1.622 4.823 2.433-.809c1.242-.401 2.557.484 2.557 1.838 0 .819-.51 1.583-1.328 1.847m-8.992-6.428l-5.01 1.675 1.619 4.828 5.011-1.674-1.62-4.829z"/></svg>
    <p>ACME Industries Ltd.<br/>Providing reliable tech since 1992</p>
  </aside>
  <nav>
    <h6 class="footer-title">Services</h6>
    <a class="link link-hover">Branding</a>
    <a class="link link-hover">Design</a>
    <a class="link link-hover">Marketing</a>
    <a class="link link-hover">Advertisement</a>
  </nav>
  <nav>
    <h6 class="footer-title">Company</h6>
    <a class="link link-hover">About us</a>
    <a class="link link-hover">Contact</a>
    <a class="link link-hover">Jobs</a>
    <a class="link link-hover">Press kit</a>
  </nav>
  <nav>
    <h6 class="footer-title">Legal</h6>
    <a class="link link-hover">Terms of use</a>
    <a class="link link-hover">Privacy policy</a>
    <a class="link link-hover">Cookie policy</a>
  </nav>
</footer>`,
    center: `<footer class="footer items-center p-4 bg-neutral text-neutral-content">
  <aside class="items-center grid-flow-col">
    <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" class="fill-current"><path d="M22.672 15.226l-2.432.811.841 2.515c.33 1.019-.209 2.127-1.23 2.456-1.15.325-2.148-.321-2.463-1.226l-.84-2.518-5.013 1.677.84 2.517c.391 1.203-.434 2.542-1.831 2.542-.88 0-1.601-.564-1.86-1.314l-.842-2.516-2.431.809c-1.135.328-2.145-.317-2.463-1.229-.329-1.018.211-2.127 1.231-2.456l2.432-.809-1.621-4.823-2.432.808c-1.355.384-2.558-.59-2.558-1.839 0-.817.509-1.582 1.327-1.846l2.433-.809-.842-2.515c-.33-1.02.211-2.129 1.232-2.458 1.02-.329 2.13.209 2.461 1.229l.842 2.515 5.011-1.677-.839-2.517c-.403-1.238.484-2.553 1.843-2.553.819 0 1.585.509 1.85 1.326l.841 2.517 2.431-.81c1.02-.33 2.131.211 2.461 1.229.332 1.018-.21 2.126-1.23 2.456l-2.433.809 1.622 4.823 2.433-.809c1.242-.401 2.557.484 2.557 1.838 0 .819-.51 1.583-1.328 1.847m-8.992-6.428l-5.01 1.675 1.619 4.828 5.011-1.674-1.62-4.829z"/></svg>
    <p>Copyright © ${new Date().getFullYear()} - All right reserved by ACME Industries Ltd</p>
  </aside>
  <nav class="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
    <a><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
    <a><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></a>
    <a><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></a>
  </nav>
</footer>`
  },

  join: {
    basic: `<div class="join">
  <button class="btn join-item">1</button>
  <button class="btn join-item">2</button>
  <button class="btn join-item">3</button>
  <button class="btn join-item">4</button>
</div>`,
    vertical: `<div class="join join-vertical">
  <button class="btn join-item">Email</button>
  <button class="btn join-item">LinkedIn</button>
  <button class="btn join-item">Google</button>
</div>`,
    responsive: `<div class="join join-vertical lg:join-horizontal">
  <input class="input input-bordered join-item" placeholder="Email" />
  <button class="btn join-item rounded-r-full">Subscribe</button>
</div>`
  },

  stack: {
    basic: `<div class="stack">
  <div class="alert alert-info shadow-lg"><span>Hello! You're great.</span></div>
  <div class="alert alert-success shadow-lg"><span>Success! Task completed.</span></div>
  <div class="alert alert-warning shadow-lg"><span>Warning! Something happened.</span></div>
</div>`,
    card: `<div class="stack">
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Notification 1</h2>
      <p>You have been invited to join Super Secret Club.</p>
    </div>
  </div>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Notification 2</h2>
      <p>New message from Sarah: "Hey! How are you?"</p>
    </div>
  </div>
</div>`,
    vertical: `<div class="stack stack-vertical">
  <button class="btn">Button 1</button>
  <button class="btn btn-primary">Button 2</button>
  <button class="btn btn-secondary">Button 3</button>
</div>`
  },

  divider: {
    horizontal: `<div class="divider"></div>`,
    vertical: `<div class="divider divider-vertical"></div>`,
    withText: `<div class="divider">OR</div>`,
    withIcon: `<div class="divider">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart-fill" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
  </svg>
</div>`
  },

  indicator: {
    basic: `<div class="indicator">
  <span class="indicator-item badge badge-secondary">new</span>
  <button class="btn">inbox</button>
</div>`,
  bottom: `<div class="indicator">
  <span class="indicator-item badge badge-secondary">new</span>
  <button class="btn">inbox</button>
</div>`,
  center: `<div class="indicator">
  <span class="indicator-item indicator-center badge">new</span>
  <button class="btn btn-circle">🔔</button>
</div>`,
  horizontal: `<div class="indicator">
  <button class="btn">inbox</button>
  <span class="indicator-item badge badge-secondary">new</span>
</div>`
},

  carousel: {
    basic: `<div class="carousel rounded-box">
  <div class="carousel-item">
    <img src="https://daisyui.com/images/stock/photo-1559703248-dcaaec9fab78.jpg" alt="Burger" />
  </div>
  <div class="carousel-item">
    <img src="https://daisyui.com/images/stock/photo-1565012793719-49d05351452d.jpg" alt="Burger" />
  </div>
  <div class="carousel-item">
    <img src="https://daisyui.com/images/stock/photo-1559181567-c3190ca9959b.jpg" alt="Burger" />
  </div>
  <div class="carousel-item">
    <img src="https://daisyui.com/images/stock/photo-1589923188900-85dae523342b.jpg" alt="Burger" />
  </div>
</div>`,
    vertical: `<div class="carousel carousel-vertical rounded-box h-96 w-72">
  <div class="carousel-item h-full">
    <img src="https://daisyui.com/images/stock/photo-1559703248-dcaaec9fab78.jpg" alt="Burger" />
  </div>
  <div class="carousel-item h-full">
    <img src="https://daisyui.com/images/stock/photo-1565012793719-49d05351452d.jpg" alt="Burger" />
  </div>
  <div class="carousel-item h-full">
    <img src="https://daisyui.com/images/stock/photo-1559181567-c3190ca9959b.jpg" alt="Burger" />
  </div>
  <div class="carousel-item h-full">
    <img src="https://daisyui.com/images/stock/photo-1589923188900-85dae523342b.jpg" alt="Burger" />
  </div>
</div>`,
    withSnap: `<div class="carousel w-full">
  <div id="slide1" class="carousel-item relative w-full">
    <img src="https://daisyui.com/images/stock/photo-1625723044792-44de16ccb4e9.jpg" class="w-full" />
    <div class="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
      <a href="#slide4" class="btn btn-circle">❮</a>
      <a href="#slide2" class="btn btn-circle">❯</a>
    </div>
  </div>
  <div id="slide2" class="carousel-item relative w-full">
    <img src="https://daisyui.com/images/stock/photo-1609621838510-5ad4156b1f94.jpg" class="w-full" />
    <div class="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
      <a href="#slide1" class="btn btn-circle">❮</a>
      <a href="#slide3" class="btn btn-circle">❯</a>
    </div>
  </div>
  <div id="slide3" class="carousel-item relative w-full">
    <img src="https://daisyui.com/images/stock/photo-1414694762283-acccc27bca85.jpg" class="w-full" />
    <div class="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
      <a href="#slide2" class="btn btn-circle">❮</a>
      <a href="#slide4" class="btn btn-circle">❯</a>
    </div>
  </div>
  <div id="slide4" class="carousel-item relative w-full">
    <img src="https://daisyui.com/images/stock/photo-1665553365602-b2fb8e5d1707.jpg" class="w-full" />
    <div class="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
      <a href="#slide3" class="btn btn-circle">❮</a>
      <a href="#slide1" class="btn btn-circle">❯</a>
    </div>
  </div>
</div>`
  },

  menu: {
    basic: `<ul class="menu bg-base-200 rounded-box w-56">
  <li><a>Item 1</a></li>
  <li><a>Item 2</a></li>
  <li><a>Item 3</a></li>
</ul>`,
    horizontal: `<ul class="menu bg-base-200 rounded-box horizontal lg:menu-horizontal">
  <li><a>Item 1</a></li>
  <li><a>Item 2</a></li>
  <li><a>Item 3</a></li>
</ul>`,
    withTitle: `<ul class="menu bg-base-200 rounded-box w-56">
  <li><a>Item 1</a></li>
  <li><a>Item 2</a></li>
  <li><a>Item 3</a></li>
  <li><a>Item 4</a></li>
  <li><a>Item 5</a></li>
</ul>`,
    nested: `<ul class="menu bg-base-200 w-56 rounded-box">
  <li><a>Item 1</a></li>
  <li>
    <details open>
      <summary>Parent</summary>
      <ul>
        <li><a>Submenu 1</a></li>
        <li><a>Submenu 2</a></li>
      </ul>
    </details>
  </li>
  <li><a>Item 3</a></li>
</ul>`
  },

  breadcrumbs: {
    basic: `<ul class="breadcrumbs text-sm">
  <li><a>Home</a></li>
  <li><a>Documents</a></li>
  <li>Add Document</li>
</ul>`,
    withContent: `<ul class="breadcrumbs px-4 py-0">
  <li><a><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM72 256a184 184 0 1 0 368 0 184 184 0 1 0 -368 0zM288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8 7.2 16 16 16h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H288V32z" /></svg> Home</a></li>
  <li><a><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z" /></svg> Documents</a></li>
  <li>Add Document</li>
</ul>`
  },

  pagination: {
    basic: `<div class="join">
  <button class="join-item btn">«</button>
  <button class="join-item btn">1</button>
  <button class="join-item btn btn-active">2</button>
  <button class="join-item btn">3</button>
  <button class="join-item btn">4</button>
  <button class="join-item btn">»</button>
</div>`,
    btnOutline: `<div class="join">
  <button class="join-item btn btn-outline">«</button>
  <button class="join-item btn btn-outline">1</button>
  <button class="join-item btn btn-outline btn-active">2</button>
  <button class="join-item btn btn-outline">3</button>
  <button class="join-item btn btn-outline">4</button>
  <button class="join-item btn btn-outline">»</button>
</div>`,
    lg: `<div class="join">
  <button class="join-item btn btn-lg">«</button>
  <button class="join-item btn btn-lg">1</button>
  <button class="join-item btn btn-lg btn-active">2</button>
  <button class="join-item btn btn-lg">3</button>
  <button class="join-item btn btn-lg">4</button>
  <button class="join-item btn btn-lg">»</button>
</div>`
  },

  steps: {
    basic: `<ul class="steps">
  <li class="step step-primary">Register</li>
  <li class="step step-primary">Choose plan</li>
  <li class="step">Purchase</li>
  <li class="step">Receive Product</li>
</ul>`,
    vertical: `<ul class="steps steps-vertical">
  <li class="step step-primary">Register</li>
  <li class="step step-primary">Choose plan</li>
  <li class="step">Purchase</li>
  <li class="step">Receive Product</li>
</ul>`,
    withContent: `<ul class="steps steps-vertical lg:steps-horizontal w-full my-10">
  <li class="step step-primary" data-content="?">Register</li>
  <li class="step step-primary" data-content="?">Choose plan</li>
  <li class="step step-primary" data-content="?">Purchase</li>
  <li class="step step-accent" data-content="!">Receive Product</li>
</ul>`
  },

  textarea: {
    basic: `<textarea class="textarea textarea-bordered" placeholder="Bio"></textarea>`,
    withLabel: `<label class="form-control">
  <div class="label">
    <span class="label-text">Your bio</span>
    <span class="label-text-alt">Alt label</span>
  </div>
  <textarea class="textarea textarea-bordered h-24" placeholder="Bio"></textarea>
  <div class="label">
    <span class="label-text-alt">Alt label</span>
    <span class="label-text-alt">Alt label</span>
  </div>
</label>`,
    primary: `<textarea class="textarea textarea-primary" placeholder="Bio"></textarea>`,
    ghost: `<textarea class="textarea textarea-ghost" placeholder="Bio"></textarea>`,
    sizes: {
      lg: `<textarea class="textarea textarea-bordered textarea-lg" placeholder="Bio"></textarea>`,
      md: `<textarea class="textarea textarea-bordered textarea-md" placeholder="Bio"></textarea>`,
      sm: `<textarea class="textarea textarea-bordered textarea-sm" placeholder="Bio"></textarea>`,
      xs: `<textarea class="textarea textarea-bordered textarea-xs" placeholder="Bio"></textarea>`
    }
  }
}

// Theme configurations
const THEMES = {
  light: {
    name: "light",
    colors: {
      primary: "#3b82f6",
      secondary: "#a855f7",
      accent: "#22c55e",
      neutral: "#3f3f46",
      "base-100": "#ffffff",
      "base-200": "#f4f4f5",
      "base-300": "#e4e4e7",
      info: "#3b82f6",
      success: "#22c55e",
      warning: "#eab308",
      error: "#ef4444"
    }
  },
  dark: {
    name: "dark",
    colors: {
      primary: "#6366f1",
      secondary: "#a855f7",
      accent: "#22d3ee",
      neutral: "#18181b",
      "base-100": "#1f2937",
      "base-200": "#111827",
      "base-300": "#0f172a",
      info: "#3b82f6",
      success: "#22c55e",
      warning: "#fbbf24",
      error: "#f87171"
    }
  },
  cupcake: {
    name: "cupcake",
    colors: {
      primary: "#65c3c8",
      secondary: "#ef476f",
      accent: "#ffbd69",
      neutral: "#3d445c",
      "base-100": "#fbfbfb",
      "base-200": "#f0f6f6",
      "base-300": "#ddebf0",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  bumblebee: {
    name: "bumblebee",
    colors: {
      primary: "#9333ea",
      secondary: "#fcd34d",
      accent: "#fb923c",
      neutral: "#3d445c",
      "base-100": "#faf5ff",
      "base-200": "#fae8ff",
      "base-300": "#f5d0fe",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  emerald: {
    name: "emerald",
    colors: {
      primary: "#10b981",
      secondary: "#ec4899",
      accent: "#8b5cf6",
      neutral: "#374151",
      "base-100": "#f0fdf4",
      "base-200": "#dcfce7",
      "base-300": "#bbf7d0",
      info: "#3abff8",
      success: "#10b981",
      warning: "#fbbf24",
      error: "#f87272"
    }
  },
  corporate: {
    name: "corporate",
    colors: {
      primary: "#4b5563",
      secondary: "#6b7280",
      accent: "#374151",
      neutral: "#1f2937",
      "base-100": "#ffffff",
      "base-200": "#f9fafb",
      "base-300": "#f3f4f6",
      info: "#3b82f6",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444"
    }
  },
  synthwave: {
    name: "synthwave",
    colors: {
      primary: "#c026d3",
      secondary: "#fbbf24",
      accent: "#06b6d4",
      neutral: "#1f1f1f",
      "base-100": "#2a2a2a",
      "base-200": "#1a1a1a",
      "base-100": "#111111",
      info: "#3b82f6",
      success: "#10b981",
      warning: "#fbbf24",
      error: "#f87272"
    }
  },
  retro: {
    name: "retro",
    colors: {
      primary: "#dc2626",
      secondary: "#fbbf24",
      accent: "#65a30d",
      neutral: "#1f2937",
      "base-100": "#e7e5e4",
      "base-200": "#d6d3d1",
      "base-300": "#a8a29e",
      info: "#3b82f6",
      success: "#10b981",
      warning: "#fbbf24",
      error: "#f87272"
    }
  },
  cyberpunk: {
    name: "cyberpunk",
    colors: {
      primary: "#facc15",
      secondary: "#ec4899",
      accent: "#06b6d4",
      neutral: "#0f172a",
      "base-100": "#1e293b",
      "base-200": "#0f172a",
      "base-300": "#020617",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  valentine: {
    name: "valentine",
    colors: {
      primary: "#ec4899",
      secondary: "#f43f5e",
      accent: "#fb7185",
      neutral: "#4c0519",
      "base-100": "#fff1f2",
      "base-200": "#ffe4e6",
      "base-300": "#fda4af",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  halloween: {
    name: "halloween",
    colors: {
      primary: "#f97316",
      secondary: "#facc15",
      accent: "#84cc16",
      neutral: "#1f2937",
      "base-100": "#fefce8",
      "base-200": "#fef9c3",
      "base-300": "#fde047",
      info: "#3b82f6",
      success: "#10b981",
      warning: "#fbbf24",
      error: "#f87272"
    }
  },
  garden: {
    name: "garden",
    colors: {
      primary: "#16a34a",
      secondary: "#facc15",
      accent: "#f97316",
      neutral: "#3f6212",
      "base-100": "#f0fdf4",
      "base-200": "#dcfce7",
      "base-300": "#bbf7d0",
      info: "#3b82f6",
      success: "#16a34a",
      warning: "#fbbf24",
      error: "#f87272"
    }
  },
  forest: {
    name: "forest",
    colors: {
      primary: "#065f46",
      secondary: "#047857",
      accent: "#059669",
      neutral: "#14532d",
      "base-100": "#ecfdf5",
      "base-200": "#d1fae5",
      "base-300": "#6ee7b7",
      info: "#3abff8",
      success: "#10b981",
      warning: "#fbbf24",
      error: "#f87272"
    }
  },
  aqua: {
    name: "aqua",
    colors: {
      primary: "#06b6d4",
      secondary: "#0ea5e9",
      accent: "#6366f1",
      neutral: "#164e63",
      "base-100": "#ecfeff",
      "base-200": "#cffafe",
      "base-300": "#a5f3fc",
      info: "#06b6d4",
      success: "#10b981",
      warning: "#fbbf24",
      error: "#f87272"
    }
  },
  lofi: {
    name: "lofi",
    colors: {
      primary: "#64748b",
      secondary: "#94a3b8",
      accent: "#475569",
      neutral: "#1e293b",
      "base-100": "#f8fafc",
      "base-200": "#f1f5f9",
      "base-300": "#e2e8f0",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  pastel: {
    name: "pastel",
    colors: {
      primary: "#7dd3fc",
      secondary: "#c4b5fd",
      accent: "#fcd34d",
      neutral: "#6b7280",
      "base-100": "#ffffff",
      "base-200": "#fef3c7",
      "base-300": "#ddd6fe",
      info: "#7dd3fc",
      success: "#86efac",
      warning: "#fcd34d",
      error: "#fca5a5"
    }
  },
  fantasy: {
    name: "fantasy",
    colors: {
      primary: "#8b5cf6",
      secondary: "#ec4899",
      accent: "#06b6d4",
      neutral: "#4c1d95",
      "base-100": "#faf5ff",
      "base-200": "#f3e8ff",
      "base-300": "#e9d5ff",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  wireframe: {
    name: "wireframe",
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#06b6d4",
      neutral: "#6b7280",
      "base-100": "#ffffff",
      "base-200": "#f3f4f6",
      "base-300": "#e5e7eb",
      info: "#3b82f6",
      success: "#10b981",
      warning: "#fbbf24",
      error: "#ef4444"
    }
  },
  black: {
    name: "black",
    colors: {
      primary: "#6366f1",
      secondary: "#a855f7",
      accent: "#22d3ee",
      neutral: "#171717",
      "base-100": "#0a0a0a",
      "base-200": "#171717",
      "base-300": "#262626",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  luxury: {
    name: "luxury",
    colors: {
      primary: "#c0a062",
      secondary: "#b8860b",
      accent: "#daa520",
      neutral: "#2d2a2e",
      "base-100": "#0a0a0a",
      "base-200": "#1a1a1a",
      "base-300": "#2a2a2a",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  dracula: {
    name: "dracula",
    colors: {
      primary: "#bd93f9",
      secondary: "#ff79c6",
      accent: "#8be9fd",
      neutral: "#44475a",
      "base-100": "#282a36",
      "base-200": "#191a21",
      "base-300": "#16161e",
      info: "#8be9fd",
      success: "#50fa7b",
      warning: "#ffb86c",
      error: "#ff5555"
    }
  },
  cmyk: {
    name: "cmyk",
    colors: {
      primary: "#00ffff",
      secondary: "#ff00ff",
      accent: "#ffff00",
      neutral: "#000000",
      "base-100": "#ffffff",
      "base-200": "#f0f0f0",
      "base-300": "#e0e0e0",
      info: "#00ffff",
      success: "#00ff00",
      warning: "#ffff00",
      error: "#ff0000"
    }
  },
  autumn: {
    name: "autumn",
    colors: {
      primary: "#f97316",
      secondary: "#ea580c",
      accent: "#fb923c",
      neutral: "#431407",
      "base-100": "#fff7ed",
      "base-200": "#ffedd5",
      "base-300": "#fed7aa",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  business: {
    name: "business",
    colors: {
      primary: "#0ea5e9",
      secondary: "#6366f1",
      accent: "#8b5cf6",
      neutral: "#1e293b",
      "base-100": "#ffffff",
      "base-200": "#f8fafc",
      "base-300": "#f1f5f9",
      info: "#0ea5e9",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444"
    }
  },
  acid: {
    name: "acid",
    colors: {
      primary: "#84cc16",
      secondary: "#22c55e",
      accent: "#06b6d4",
      neutral: "#0f172a",
      "base-100": "#f0fdf4",
      "base-200": "#dcfce7",
      "base-300": "#bbf7d0",
      info: "#3abff8",
      success: "#84cc16",
      warning: "#fbbf24",
      error: "#f87272"
    }
  },
  lemonade: {
    name: "lemonade",
    colors: {
      primary: "#fbbf24",
      secondary: "#fb923c",
      accent: "#facc15",
      neutral: "#422006",
      "base-100": "#fffbeb",
      "base-200": "#fef3c7",
      "base-300": "#fde68a",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbf24",
      error: "#f87272"
    }
  },
  night: {
    name: "night",
    colors: {
      primary: "#6366f1",
      secondary: "#a855f7",
      accent: "#06b6d4",
      neutral: "#1f2937",
      "base-100": "#111827",
      "base-200": "#1f2937",
      "base-300": "#374151",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  coffee: {
    name: "coffee",
    colors: {
      primary: "#a16207",
      secondary: "#713f12",
      accent: "#ca8a04",
      neutral: "#292524",
      "base-100": "#fafaf9",
      "base-200": "#f5f5f4",
      "base-300": "#e7e5e4",
      info: "#3abff8",
      success: "#36d399",
      warning: "#fbbd24",
      error: "#f87272"
    }
  },
  winter: {
    name: "winter",
    colors: {
      primary: "#0ea5e9",
      secondary: "#6366f1",
      accent: "#8b5cf6",
      neutral: "#1e293b",
      "base-100": "#f0f9ff",
      "base-200": "#e0f2fe",
      "base-300": "#bae6fd",
      info: "#0ea5e9",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444"
    }
  }
}

export default tool({
  description: "Generate daisyUI components and access comprehensive documentation for all 65+ components, themes, and utilities",
  args: {
    action: tool.schema.string().describe("Action to perform: 'list-components', 'get-component', 'list-themes', 'get-theme', 'generate-component', 'search'"),
    component: tool.schema.string().optional().describe("Component name (e.g., 'button', 'card', 'modal')"),
    variant: tool.schema.string().optional().describe("Component variant (e.g., 'basic', 'primary', 'outline')"),
    category: tool.schema.string().optional().describe("Component category (e.g., 'actions', 'dataDisplay', 'navigation')"),
    theme: tool.schema.string().optional().describe("Theme name (e.g., 'light', 'dark', 'cupcake')"),
    search: tool.schema.string().optional().describe("Search term for finding components"),
    custom: tool.schema.boolean().optional().describe("Whether to include custom Tailwind utilities in output")
  },
  async execute(args) {
    const action = args.action || "list-components"
    const component = args.component?.toLowerCase()
    const variant = args.variant?.toLowerCase()
    const category = args.category?.toLowerCase()
    const theme = args.theme?.toLowerCase()
    const searchTerm = args.search?.toLowerCase()
    const custom = args.custom || false

    try {
      switch (action) {
        case "list-components":
          return listComponents(category)
        case "get-component":
          return getComponent(component, variant, custom)
        case "list-themes":
          return listThemes()
        case "get-theme":
          return getTheme(theme)
        case "generate-component":
          return generateComponent(component, variant, custom)
        case "search":
          return searchComponents(searchTerm)
        default:
          return generateComponent(component, variant, custom)
      }
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
    }
  }
})

function listComponents(category?: string) {
  if (category) {
    if (!COMPONENT_CATEGORIES[category as keyof typeof COMPONENT_CATEGORIES]) {
      return `Error: Category '${category}' not found. Available categories: ${Object.keys(COMPONENT_CATEGORIES).join(", ")}`
    }
    return JSON.stringify({
      category: category,
      components: COMPONENT_CATEGORIES[category as keyof typeof COMPONENT_CATEGORIES]
    }, null, 2)
  }

  return JSON.stringify({
    totalCategories: Object.keys(COMPONENT_CATEGORIES).length,
    totalComponents: Object.values(COMPONENT_CATEGORIES).flat().length,
    categories: COMPONENT_CATEGORIES
  }, null, 2)
}

function getComponent(componentName?: string, variant?: string, custom: boolean = false) {
  if (!componentName) {
    return "Error: Component name is required. Use 'list-components' to see available components."
  }

  // Find the component (handle hyphenated names by converting to underscore)
  const normalizedName = componentName.replace(/-/g, "")
  let componentData: any = null

  // Search for the component in templates
  for (const [key, value] of Object.entries(COMPONENT_TEMPLATES)) {
    if (key === normalizedName || key === componentName) {
      componentData = value
      break
    }
  }

  if (!componentData) {
    return `Error: Component '${componentName}' not found. Available components: ${Object.keys(COMPONENT_TEMPLATES).join(", ")}`
  }

  // If variant is specified, return that specific variant
  if (variant) {
    if (typeof componentData === 'string') {
      // Single template, no variants
      return `Component '${componentName}' has no variants. Available template:\n\n${componentData}`
    } else if (variant === 'basic' || variant === 'default') {
      if (typeof componentData.basic === 'string') {
        return componentData.basic
      }
    } else if (componentData[variant]) {
      return componentData[variant]
    } else {
      // Search in nested objects
      for (const [key, value] of Object.entries(componentData)) {
        if (typeof value === 'object' && value[variant]) {
          return value[variant]
        }
      }
      return `Error: Variant '${variant}' not found for component '${componentName}'. Available variants: ${Object.keys(componentData).join(", ")}`
    }
  }

  // Return all templates for the component
  if (typeof componentData === 'string') {
    return componentData
  }

  return JSON.stringify(componentData, null, 2)
}

function generateComponent(componentName?: string, variant?: string, custom: boolean = false) {
  const componentCode = getComponent(componentName, variant, custom)

  if (componentCode.startsWith("Error:")) {
    return componentCode
  }

  // If custom utilities are requested, add some common Tailwind utilities
  if (custom) {
    const utilities = [
      "\n<!-- Additional Tailwind Utilities -->",
      "<!-- You can customize these utilities based on your needs -->",
      "<!-- Common utilities: w-full, h-full, max-w, min-w, max-h, min-h, m-*, p-*, gap-*, flex, grid, etc. -->",
      "",
      "<!-- Responsive utilities: sm:*, md:*, lg:*, xl:*, 2xl:* -->",
      "<!-- State utilities: hover:*, focus:*, active:*, disabled:* -->",
      "<!-- Color utilities: bg-*, text-*, border-*, ring-*, shadow-* -->"
    ].join("\n")

    return `${componentCode}\n\n${utilities}`
  }

  return componentCode
}

function listThemes() {
  const themeList = Object.values(THEMES).map(theme => ({
    name: theme.name,
    preview: `Primary: ${theme.colors.primary}, Secondary: ${theme.colors.secondary}, Accent: ${theme.colors.accent}`
  }))

  return JSON.stringify({
    totalThemes: themeList.length,
    themes: themeList
  }, null, 2)
}

function getTheme(themeName?: string) {
  if (!themeName) {
    return "Error: Theme name is required. Use 'list-themes' to see available themes."
  }

  const theme = THEMES[themeName as keyof typeof THEMES]

  if (!theme) {
    return `Error: Theme '${themeName}' not found. Available themes: ${Object.keys(THEMES).join(", ")}`
  }

  return JSON.stringify(theme, null, 2)
}

function searchComponents(searchTerm?: string) {
  if (!searchTerm) {
    return "Error: Search term is required."
  }

  const results: Array<{ component: string; category: string }> = []

  // Search in component templates
  for (const [componentName, templates] of Object.entries(COMPONENT_TEMPLATES)) {
    if (componentName.toLowerCase().includes(searchTerm)) {
      // Find which category this component belongs to
      for (const [category, components] of Object.entries(COMPONENT_CATEGORIES)) {
        if (components.includes(componentName)) {
          results.push({ component: componentName, category })
          break
        }
      }
    }
  }

  if (results.length === 0) {
    return `No components found matching '${searchTerm}'. Try a different search term.`
  }

  return JSON.stringify({
    searchTerm: searchTerm,
    totalResults: results.length,
    results: results
  }, null, 2)
}
