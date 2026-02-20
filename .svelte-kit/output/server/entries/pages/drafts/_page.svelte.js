import { a2 as head, e as escape_html, $ as attr, a1 as stringify, a0 as attr_class, a3 as ensure_array_like, _ as derived } from "../../../chunks/index.js";
import { H as Header } from "../../../chunks/Header.js";
import { T as ThreeBackground } from "../../../chunks/ThreeBackground.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let filteredDrafts = derived(() => () => {
      let result = data.drafts;
      return result;
    });
    let pending = derived(() => data.drafts.filter((d) => d.status === "pending"));
    let approved = derived(() => data.drafts.filter((d) => d.status === "approved"));
    let rejected = derived(() => data.drafts.filter((d) => d.status === "rejected"));
    function formatDate(date) {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    head("1nln88x", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Drafts | te9-archives</title>`);
      });
    });
    if (data.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="min-h-screen flex items-center justify-center"><div class="text-center"><h1 class="text-2xl font-bold text-red-500 mb-4">Access Denied</h1> <p class="text-zinc-500">${escape_html(data.error)}</p></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      Header($$renderer2);
      $$renderer2.push(`<!----> `);
      ThreeBackground($$renderer2);
      $$renderer2.push(`<!----> <main class="pt-16 flex-1 flex flex-col"><section class="flex-1 flex flex-col"><div class="max-w-[2560px] mx-auto w-full"><div class="border-x border-zinc-200 bg-white/80 backdrop-blur-sm px-6 py-4 border-b"><div class="flex flex-wrap gap-4 items-center"><h1 class="text-xl font-semibold text-zinc-900">Drafts</h1> <div class="flex-1"></div> <a${attr("href", `/bookmarks?key=${stringify(data.apiKey)}`)} class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Bookmarks</a></div></div> <div class="border-x border-zinc-200 bg-white/60 backdrop-blur-sm px-6 py-3 border-b"><div class="flex gap-2"><button${attr_class(`px-3 py-1.5 rounded-lg text-sm transition-colors ${stringify(
        "bg-zinc-900 text-white"
      )}`)}>All (${escape_html(data.drafts.length)})</button> <button${attr_class(`px-3 py-1.5 rounded-lg text-sm transition-colors ${stringify("bg-amber-100 text-amber-700 hover:bg-amber-200")}`)}>Pending (${escape_html(pending().length)})</button> <button${attr_class(`px-3 py-1.5 rounded-lg text-sm transition-colors ${stringify("bg-emerald-100 text-emerald-700 hover:bg-emerald-200")}`)}>Approved (${escape_html(approved().length)})</button> <button${attr_class(`px-3 py-1.5 rounded-lg text-sm transition-colors ${stringify("bg-red-100 text-red-700 hover:bg-red-200")}`)}>Rejected (${escape_html(rejected().length)})</button></div></div> `);
      if (filteredDrafts()().length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="text-center py-24 text-zinc-400"><p>No drafts found</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="grid border-x border-zinc-200" style="grid-template-columns: repeat(auto-fill, minmax(400px, 1fr))"><!--[-->`);
        const each_array = ensure_array_like(filteredDrafts()());
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let draft = each_array[$$index];
          const bookmark = data.bookmarkMap?.[draft.bookmark_id];
          $$renderer2.push(`<a${attr("href", `/drafts/${stringify(draft.id)}?key=${stringify(data.apiKey)}`)} class="block border-b border-r border-zinc-200 hover:bg-zinc-50 transition-colors duration-200 group"><article class="p-5 flex flex-col h-full"><div class="flex items-start justify-between mb-2"><span${attr_class(`text-xs font-medium px-2 py-0.5 rounded-full ${stringify(draft.status === "approved" ? "bg-emerald-100 text-emerald-700" : draft.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}`)}>${escape_html(draft.status)}</span> <span class="text-xs text-zinc-400">${escape_html(formatDate(draft.created_at))}</span></div> <h3 class="font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors line-clamp-2 mb-2">${escape_html(draft.title)}</h3> `);
          if (bookmark) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p class="text-sm text-zinc-500 mb-2">From: ${escape_html(bookmark.title)}</p>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (draft.feedback) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p class="text-sm text-red-500 line-clamp-1 mt-auto">Feedback: ${escape_html(draft.feedback)}</p>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></article></a>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></section></main>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
