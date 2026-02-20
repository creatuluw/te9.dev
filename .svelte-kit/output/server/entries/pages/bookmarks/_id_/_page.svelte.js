import { a2 as head, $ as attr, a1 as stringify, e as escape_html, a3 as ensure_array_like, a0 as attr_class } from "../../../../chunks/index.js";
import { H as Header } from "../../../../chunks/Header.js";
import { T as ThreeBackground } from "../../../../chunks/ThreeBackground.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let bookmark = data.bookmark;
    let categories = data.categories;
    let drafts = data.drafts;
    data.skillDraft;
    let title = bookmark.title;
    let category = bookmark.category;
    let reason = bookmark.reason_for_bookmark || "";
    let blogApproved = bookmark.blog_approved;
    let tags = bookmark.tags?.join(", ") || "";
    let showNewCategoryInput = false;
    let saving = false;
    let generating = false;
    function formatDate(date) {
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
    function formatShortDate(date) {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    head("k3ek72", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(bookmark.title)} | Bookmarks</title>`);
      });
    });
    Header($$renderer2);
    $$renderer2.push(`<!----> `);
    ThreeBackground($$renderer2);
    $$renderer2.push(`<!----> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <main class="pt-16 flex-1 flex flex-col"><section class="flex-1 flex flex-col"><div class="max-w-[2560px] mx-auto w-full"><div class="border-x border-zinc-200 bg-white/80 backdrop-blur-sm px-6 py-4 border-b"><a${attr("href", `/bookmarks?key=${stringify(data.apiKey)}`)} class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">← Back to Bookmarks</a></div> <div class="border-x border-zinc-200 p-6 lg:p-8"><div class="max-w-3xl mx-auto"><div class="bg-white border border-zinc-200 rounded-xl p-6 lg:p-8 shadow-sm"><div class="mb-6 p-4 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between gap-4"><div class="flex-1 min-w-0"><p class="text-xs text-zinc-400 mb-1">Original URL</p> <p class="text-sm text-zinc-600 truncate">${escape_html(bookmark.link)}</p></div> <a${attr("href", bookmark.link)} target="_blank" rel="noopener noreferrer" class="flex-shrink-0 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg> Visit</a></div> <div class="space-y-6"><div><label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Title</label> <input type="text"${attr("value", title)} class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"/></div> <div><label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Category</label> `);
    if (categories.length > 10) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<input type="text"${attr("value", category)} list="category-list" placeholder="Select or type new category..." class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"/> <datalist id="category-list"><!--[-->`);
      const each_array_1 = ensure_array_like(categories);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let cat = each_array_1[$$index_1];
        $$renderer2.option({ value: cat.name }, ($$renderer3) => {
          $$renderer3.push(`${escape_html(cat.name)}`);
        });
      }
      $$renderer2.push(`<!--]--></datalist>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex gap-2">`);
      $$renderer2.select(
        {
          value: category,
          onchange: () => showNewCategoryInput = false,
          class: "flex-1 bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array_2 = ensure_array_like(categories);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let cat = each_array_2[$$index_2];
            $$renderer3.option({ value: cat.name }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(cat.name)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(` <button type="button" class="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-sm border border-zinc-200 transition-colors whitespace-nowrap">+ New</button></div> `);
      if (showNewCategoryInput) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<input type="text"${attr("value", category)} placeholder="New category name..." class="w-full mt-2 bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"/>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <div><label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Tags (comma-separated)</label> <input type="text"${attr("value", tags)} placeholder="tag1, tag2, tag3" class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"/></div> <div><label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Reason for Bookmark</label> <textarea${attr("rows", 3)} placeholder="Why did you bookmark this? What's interesting about it?" class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400">`);
    const $$body_1 = escape_html(reason);
    if ($$body_1) {
      $$renderer2.push(`${$$body_1}`);
    }
    $$renderer2.push(`</textarea></div> <div><label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Approved for blog post</label> <div class="flex gap-2"><button type="button"${attr_class(`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${stringify(blogApproved === true ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200")}`)}>Yes</button> <button type="button"${attr_class(`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${stringify(blogApproved === false ? "bg-red-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200")}`)}>No</button></div> `);
    if (blogApproved === false) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-xs text-zinc-400 mt-2">Hidden from bookmarks list</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (bookmark.excerpt) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div><label class="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Excerpt</label> <p class="text-zinc-500 bg-zinc-50 rounded-lg px-4 py-3 border border-zinc-200">${escape_html(bookmark.excerpt)}</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="pt-4 border-t border-zinc-200"><p class="text-sm text-zinc-400">Bookmarked on ${escape_html(formatDate(bookmark.created_at))}</p></div></div> <div class="flex gap-4 mt-8 pt-6 border-t border-zinc-200"><button${attr("disabled", saving, true)} class="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">${escape_html("Save Changes")}</button> <button${attr("disabled", generating, true)} class="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg font-medium disabled:opacity-50 border border-zinc-200 transition-colors">${escape_html("+ Generate Draft")}</button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (drafts.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mt-8"><h2 class="text-lg font-semibold text-zinc-900 mb-4">Drafts (${escape_html(drafts.length)})</h2> <div class="space-y-3"><!--[-->`);
      const each_array_3 = ensure_array_like(drafts);
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let draft = each_array_3[$$index_3];
        $$renderer2.push(`<div class="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"><div class="flex items-start justify-between gap-4"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1">`);
        if (draft.draft_type === "skill") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">Skill</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Blog Post</span>`);
        }
        $$renderer2.push(`<!--]--> <span${attr_class(`px-2 py-0.5 rounded-full text-xs font-medium ${stringify(draft.status === "approved" ? "bg-emerald-100 text-emerald-700" : draft.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}`)}>${escape_html(draft.status)}</span></div> <h3 class="font-medium text-zinc-900 truncate">${escape_html(draft.title)}</h3> <p class="text-xs text-zinc-400 mt-1">${escape_html(formatShortDate(draft.created_at))}</p></div> <div class="flex items-center gap-2"><a${attr("href", `/drafts/${stringify(draft.id)}?key=${stringify(data.apiKey)}`)} class="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm transition-colors">View</a> <button class="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete draft"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></div></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div></div></section></main>`);
  });
}
export {
  _page as default
};
