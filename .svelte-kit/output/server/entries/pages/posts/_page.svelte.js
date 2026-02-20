import { a2 as head, a3 as ensure_array_like, $ as attr, a1 as stringify, e as escape_html } from "../../../chunks/index.js";
import { H as Header } from "../../../chunks/Header.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    function formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    head("lvfn04", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Articles - te9-archives</title>`);
      });
    });
    Header($$renderer2);
    $$renderer2.push(`<!----> <main class="pt-16 flex-1"><div class="max-w-4xl mx-auto px-6 py-12"><h1 class="text-3xl font-semibold tracking-tight mb-8">Articles</h1> <div class="space-y-6"><!--[-->`);
    const each_array = ensure_array_like(data.posts);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let post = each_array[$$index];
      $$renderer2.push(`<a${attr("href", `/posts/${stringify(post.slug)}`)} class="block p-6 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors group"><span class="text-xs font-medium text-zinc-400 uppercase tracking-widest">${escape_html(formatDate(post.date))}</span> <h2 class="text-lg font-semibold tracking-tight mt-2 mb-2 group-hover:text-zinc-600 transition-colors">${escape_html(post.title)}</h2> <p class="text-zinc-500 text-sm leading-relaxed">${escape_html(post.description)}</p></a>`);
    }
    $$renderer2.push(`<!--]--></div></div></main>`);
  });
}
export {
  _page as default
};
