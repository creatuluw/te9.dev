import { a2 as head, $ as attr, a1 as stringify, a0 as attr_class, e as escape_html, _ as derived } from "../../../../chunks/index.js";
import { marked } from "marked";
import { H as Header } from "../../../../chunks/Header.js";
import { T as ThreeBackground } from "../../../../chunks/ThreeBackground.js";
import { h as html } from "../../../../chunks/html.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let draft = data.draft;
    let content = draft.content;
    let feedback = draft.feedback || "";
    let saving = false;
    let publishing = false;
    let renderedContent = derived(() => marked(content));
    function formatDate(date) {
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    head("152dem1", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(draft.title)} | Drafts</title>`);
      });
    });
    Header($$renderer2);
    $$renderer2.push(`<!----> `);
    ThreeBackground($$renderer2);
    $$renderer2.push(`<!----> <main class="pt-16 flex-1 flex flex-col"><section class="flex-1 flex flex-col"><div class="max-w-[2560px] mx-auto w-full"><div class="border-x border-zinc-200 bg-white/80 backdrop-blur-sm px-6 py-4 border-b"><div class="flex items-center justify-between"><a${attr("href", `/drafts?key=${stringify(data.apiKey)}`)} class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">← Back to Drafts</a> <div class="flex items-center gap-3">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <span${attr_class(`px-3 py-1 rounded-full text-xs font-medium ${stringify(draft.status === "approved" ? "bg-emerald-100 text-emerald-700" : draft.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}`)}>${escape_html(draft.status)}</span></div></div></div> <div class="border-x border-zinc-200 p-6 lg:p-8"><div class="max-w-4xl mx-auto"><div class="mb-8"><h1 class="text-2xl font-semibold text-zinc-900 mb-2">${escape_html(draft.title)}</h1> <p class="text-zinc-500 text-sm">Slug: <code class="bg-zinc-100 px-2 py-1 rounded text-zinc-600">${escape_html(draft.slug)}</code></p> `);
    if (data.bookmark) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-zinc-500 text-sm mt-2">From bookmark: <a${attr("href", `/bookmarks/${stringify(data.bookmark.id)}?key=${stringify(data.apiKey)}`)} class="text-zinc-900 hover:text-zinc-600 underline">${escape_html(data.bookmark.title)}</a></p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm"><div class="flex border-b border-zinc-200"><button${attr_class(`px-6 py-3 text-sm font-medium transition-colors ${stringify(
        "bg-zinc-100 text-zinc-900"
      )}`)}>Preview</button> <button${attr_class(`px-6 py-3 text-sm font-medium transition-colors ${stringify("text-zinc-500 hover:text-zinc-900")}`)}>Published View</button> <button${attr_class(`px-6 py-3 text-sm font-medium transition-colors ${stringify("text-zinc-500 hover:text-zinc-900")}`)}>Edit Markdown</button></div> `);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="p-6 lg:p-8 prose max-w-none">`);
        if (content) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`${html(renderedContent())}`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<p class="text-zinc-400 italic">No content yet</p>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (draft.status === "pending") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mt-6 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm"><h3 class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Review Feedback</h3> <textarea${attr("rows", 3)} placeholder="Add feedback if requesting changes..." class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400">`);
      const $$body_1 = escape_html(feedback);
      if ($$body_1) {
        $$renderer2.push(`${$$body_1}`);
      }
      $$renderer2.push(`</textarea></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (draft.status === "rejected" && draft.feedback) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mt-6 bg-red-50 border border-red-200 rounded-xl p-6"><h3 class="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Feedback</h3> <p class="text-red-600">${escape_html(draft.feedback)}</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex flex-wrap gap-4 mt-8 pt-6 border-t border-zinc-200">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (draft.status === "pending" && true) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button${attr("disabled", saving, true)} class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">Approve</button> <button${attr("disabled", !feedback.trim(), true)} class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">Request Changes</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (draft.status === "approved" && true) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button${attr("disabled", publishing, true)} class="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">${escape_html("Publish to Blog")}</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="mt-8 text-sm text-zinc-400"><p>Created: ${escape_html(formatDate(draft.created_at))}</p> <p>Updated: ${escape_html(formatDate(draft.updated_at))}</p></div></div></div></div></section></main>`);
  });
}
export {
  _page as default
};
