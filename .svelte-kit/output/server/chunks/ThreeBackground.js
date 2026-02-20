import "clsx";
function ThreeBackground($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<canvas class="fixed top-0 left-0 w-full h-full pointer-events-none z-10"></canvas>`);
  });
}
export {
  ThreeBackground as T
};
