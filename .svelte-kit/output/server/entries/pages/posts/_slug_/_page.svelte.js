import { a2 as head, e as escape_html, _ as derived, $ as attr } from "../../../../chunks/index.js";
import { H as Header } from "../../../../chunks/Header.js";
import { h as html } from "../../../../chunks/html.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    function formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
    const typeLabel = derived(() => data.meta._postType === "skill" ? "Skill" : null);
    head("14u6r3i", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.meta.title)} - te9-archives</title>`);
      });
      $$renderer3.push(`<meta name="description"${attr("content", data.meta.description)}/>`);
    });
    Header($$renderer2);
    $$renderer2.push(`<!----> <main class="pt-16 flex-1"><article class="max-w-4xl mx-auto px-6 py-12"><a href="/" class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6 inline-block">← Back to articles</a> <header class="mb-8"><span class="text-xs font-medium text-zinc-400 uppercase tracking-widest">${escape_html(typeLabel() ? `${typeLabel()} · ` : "")}${escape_html(formatDate(data.meta.date))}</span> <h1 class="text-4xl font-semibold tracking-tight mt-2">${escape_html(data.meta.title)}</h1></header> <div class="prose">${html(data.content)}</div></article></main>`);
  });
}
export {
  _page as default
};
