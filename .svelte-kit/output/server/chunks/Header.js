import "clsx";
function Header($$renderer) {
  $$renderer.push(`<header class="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-zinc-100"><nav class="max-w-[2560px] mx-auto px-6 h-16 flex items-center justify-between"><a href="/" class="flex items-center gap-2"><div class="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center"><span class="iconify text-white text-lg" data-icon="mdi:feather"></span></div> <span class="font-semibold tracking-tight">te9-archives</span></a> <div class="hidden md:flex items-center gap-8"><a href="/" class="text-sm text-zinc-900 font-medium">Home</a> <a href="/posts" class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200">Articles</a> <a href="/about" class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200">About</a></div> <button class="md:hidden p-2 hover:bg-zinc-50 rounded-lg transition-colors" aria-label="Open menu"><span class="iconify text-xl" data-icon="mdi:menu"></span></button></nav></header>`);
}
export {
  Header as H
};
