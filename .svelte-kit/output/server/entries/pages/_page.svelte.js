import { $ as attr, a0 as attr_class, a1 as stringify, e as escape_html, _ as derived, a2 as head, a3 as ensure_array_like, a4 as attr_style } from "../../chunks/index.js";
import { H as Header } from "../../chunks/Header.js";
function ArticleCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { post } = $$props;
    const href = derived(() => post._draftId ? `/articles/${post._draftId}` : `/posts/${post.slug}`);
    const typeLabel = derived(() => post._draftType === "skill" || post._postType === "skill" ? "Skill" : null);
    function formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    const animationClass = derived(() => "");
    $$renderer2.push(`<a${attr("href", href())}${attr_class(`block ${stringify(animationClass())}`)}><article class="p-5 border-zinc-200 hover:bg-zinc-50 transition-colors duration-200 group flex flex-col border-b border-r h-full"><span class="text-xs font-medium text-zinc-400 uppercase tracking-widest">${escape_html(typeLabel() ? `${typeLabel()} · ` : "")}${escape_html(formatDate(post.date))}</span> <h2 class="text-base font-semibold tracking-tight mt-2 mb-1 group-hover:text-zinc-600 transition-colors">${escape_html(post.title)}</h2> <p class="text-zinc-500 text-sm font-light leading-relaxed line-clamp-2">${escape_html(post.description)}</p></article></a>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const posts = derived(() => data.posts);
    const rowConfigs = [6, 8, 5, 7, 6, 8, 5, 7, 6, 5, 8, 7, 6, 5, 8, 7];
    const rows = derived(() => () => {
      const result = [];
      let postIndex = 0;
      let rowIndex = 0;
      while (postIndex < posts().length) {
        const cols = rowConfigs[rowIndex % rowConfigs.length];
        const row = [];
        for (let col = 0; col < cols && postIndex < posts().length; col++) {
          row.push(posts()[postIndex++]);
        }
        result.push(row);
        rowIndex++;
      }
      return result;
    });
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>te9-archives</title>`);
      });
    });
    Header($$renderer2);
    $$renderer2.push(`<!----> <main class="pt-16 flex-1 flex flex-col"><section class="flex-1 flex flex-col"><div class="max-w-[2560px] mx-auto w-full"><!--[-->`);
    const each_array = ensure_array_like(rows()());
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let row = each_array[i];
      $$renderer2.push(`<div class="grid border-x border-zinc-200"${attr_style(`grid-template-columns: repeat(${stringify(row.length)}, 1fr)`)}><!--[-->`);
      const each_array_1 = ensure_array_like(row);
      for (let j = 0, $$length2 = each_array_1.length; j < $$length2; j++) {
        let post = each_array_1[j];
        ArticleCard($$renderer2, { post });
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div></section></main>`);
  });
}
export {
  _page as default
};
