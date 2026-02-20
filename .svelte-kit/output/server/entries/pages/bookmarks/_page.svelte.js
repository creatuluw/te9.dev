import { a2 as head, e as escape_html, a3 as ensure_array_like, $ as attr, a1 as stringify, _ as derived } from "../../../chunks/index.js";
import { H as Header } from "../../../chunks/Header.js";
import { T as ThreeBackground } from "../../../chunks/ThreeBackground.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let selectedCategory = "";
    let syncing = false;
    let bookmarks = data.bookmarks;
    let categories = data.categories;
    let raindropTotal = data.raindropTotal;
    let remainingToSync = derived(() => raindropTotal - bookmarks.length);
    let filteredBookmarks = derived(() => () => {
      let result = bookmarks;
      return result;
    });
    function formatDate(date) {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    function truncate(text, length) {
      if (!text) return "";
      return text.length > length ? text.slice(0, length) + "..." : text;
    }
    head("18cncau", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Bookmarks | te9-archives</title>`);
      });
    });
    if (data.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="min-h-screen flex items-center justify-center"><div class="text-center"><h1 class="text-2xl font-bold text-red-500 mb-4">Access Denied</h1> <p class="text-zinc-500">${escape_html(data.error)}</p> <p class="text-zinc-400 mt-2 text-sm">Add ?key=YOUR_API_KEY to the URL</p></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
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
      $$renderer2.push(`<!--]--> <main class="pt-16 flex-1 flex flex-col"><section class="flex-1 flex flex-col"><div class="max-w-[2560px] mx-auto w-full"><div class="border-x border-zinc-200 bg-white/80 backdrop-blur-sm px-6 py-4 border-b"><div class="flex flex-wrap gap-4 items-center"><h1 class="text-xl font-semibold text-zinc-900">Bookmarks</h1> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="flex-1"></div> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      $$renderer2.select(
        {
          value: selectedCategory,
          class: "bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`All Categories`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(categories);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let cat = each_array[$$index];
            $$renderer3.option({ value: cat.name }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(cat.name)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(` <a${attr("href", `/drafts?key=${stringify(data.apiKey)}`)} class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Drafts</a></div></div> `);
      if (filteredBookmarks()().length === 0) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="text-center py-24 text-zinc-400"><p>No bookmarks found</p> <p class="text-sm mt-2">Click "Sync" to import your bookmarks</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="grid border-x border-zinc-200" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))"><!--[-->`);
        const each_array_1 = ensure_array_like(filteredBookmarks()());
        for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
          let bookmark = each_array_1[$$index_2];
          $$renderer2.push(`<a${attr("href", `/bookmarks/${stringify(bookmark.id)}?key=${stringify(data.apiKey)}`)} class="block border-b border-r border-zinc-200 hover:bg-zinc-50 transition-colors duration-200 group"><article class="p-5 flex flex-col h-full"><div class="flex items-start justify-between mb-2"><span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">${escape_html(bookmark.category)}</span> `);
          if (bookmark.blog_approved) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="text-xs text-emerald-600">Approved</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div> <h3 class="font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors line-clamp-2 mb-2">${escape_html(bookmark.title)}</h3> `);
          if (bookmark.excerpt) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p class="text-zinc-500 text-sm font-light leading-relaxed line-clamp-2 mb-3 flex-1">${escape_html(truncate(bookmark.excerpt, 120))}</p>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> <div class="flex items-center justify-between text-xs text-zinc-400 mt-auto"><span class="truncate max-w-[150px]">${escape_html(bookmark.domain)}</span> <span>${escape_html(formatDate(bookmark.created_at))}</span></div> `);
          if (bookmark.tags && bookmark.tags.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="flex flex-wrap gap-1 mt-3"><!--[-->`);
            const each_array_2 = ensure_array_like(bookmark.tags.slice(0, 3));
            for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
              let tag = each_array_2[$$index_1];
              $$renderer2.push(`<span class="px-2 py-0.5 text-xs bg-zinc-100 rounded text-zinc-500">${escape_html(tag)}</span>`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></article></a>`);
        }
        $$renderer2.push(`<!--]--> `);
        if (remainingToSync() > 0 && !selectedCategory) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<button${attr("disabled", syncing, true)} class="block border-b border-r border-zinc-200 hover:bg-zinc-900 hover:border-zinc-900 transition-colors duration-200 group cursor-pointer"><article class="p-5 flex flex-col h-full items-center justify-center text-center min-h-[200px]"><div class="w-12 h-12 rounded-full bg-zinc-100 group-hover:bg-white flex items-center justify-center mb-4 transition-colors"><svg class="w-6 h-6 text-zinc-500 group-hover:text-zinc-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></div> <span class="text-sm font-medium text-zinc-900 group-hover:text-white transition-colors">Sync more bookmarks</span> <span class="text-xs text-zinc-400 group-hover:text-zinc-300 mt-1 transition-colors">${escape_html(remainingToSync())} remaining</span></article></button>`);
        } else {
          $$renderer2.push("<!--[!-->");
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
