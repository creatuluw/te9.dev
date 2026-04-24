// ============================================================
// Design System Documentation — Interactive Script
// ============================================================

// ------------------------------------------------------------
// 1. Export function — downloads design-system.json as a file
// ------------------------------------------------------------
async function exportDesignSystem() {
  try {
    const response = await fetch("design-system.json");
    if (!response.ok) throw new Error("Failed to load design-system.json");
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-system.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert(
      "Failed to export design system. Make sure design-system.json is in the same directory as index.html.",
    );
  }
}

// ------------------------------------------------------------
// 2. Navbar scroll behavior — toggle 'scrolled' class
// ------------------------------------------------------------
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 100);
});

// ------------------------------------------------------------
// 3. Section reveal — IntersectionObserver for .section-reveal
// ------------------------------------------------------------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -60px 0px" },
);

document.querySelectorAll(".section-reveal").forEach((el) => {
  revealObserver.observe(el);
});

// ------------------------------------------------------------
// 4. Sidebar link active state — click handler
// ------------------------------------------------------------
document.querySelectorAll(".sidebar-link").forEach((link) => {
  link.addEventListener("click", function () {
    document
      .querySelectorAll(".sidebar-link")
      .forEach((l) => l.classList.remove("active"));
    this.classList.add("active");
  });
});

// ------------------------------------------------------------
// 5. Modal keyboard close — ESC key closes .modal-overlay
// ------------------------------------------------------------
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.active").forEach((overlay) => {
      overlay.classList.remove("active");
    });
  }
});

// ------------------------------------------------------------
// 6. Tab switching — .tabs[data-tab-group] and [data-tab-panel]
// ------------------------------------------------------------
document.querySelectorAll(".tabs[data-tab-group]").forEach((tabBar) => {
  const groupName = tabBar.dataset.tabGroup;
  const panels = document.querySelectorAll(
    `[data-tab-group="${groupName}"] ~ [data-tab-panel], ` +
      `.tab-panels[data-tab-group="${groupName}"] [data-tab-panel]`,
  );

  tabBar.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      // Update active tab
      tabBar
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Determine the target panel
      const target = tab.dataset.tab;

      // Find panels — look within closest component container or fallback to grouped panels
      const container =
        tabBar.closest(".concept-showcase") ||
        tabBar.closest(".component-example") ||
        tabBar.parentElement;

      const allPanels = container
        ? container.querySelectorAll("[data-tab-panel]")
        : panels;

      allPanels.forEach((panel) => {
        if (panel.dataset.tabPanel === target) {
          panel.style.display = "";
          panel.classList.add("active");
        } else {
          panel.style.display = "none";
          panel.classList.remove("active");
        }
      });
    });
  });
});

// ------------------------------------------------------------
// 7. Stagger observer — adds 'stagger-in' class on viewport entry
// ------------------------------------------------------------
const staggerObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("stagger-in");
        staggerObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 },
);

document.querySelectorAll(".stagger-observe").forEach((el) => {
  staggerObserver.observe(el);
});

// ------------------------------------------------------------
// 8. Timeline line animation — triggers drawLine when visible
// ------------------------------------------------------------
const timelineLine = document.querySelector(".timeline-line");
if (timelineLine) {
  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          timelineLine.style.animation =
            "drawLine 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards";
          timelineObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );
  timelineObserver.observe(timelineLine);
}

// ------------------------------------------------------------
// 9. Animation replay — replayAnim(btn) function
// ------------------------------------------------------------
function replayAnim(btn) {
  const wrapper = btn.closest(".anim-demo-wrapper");
  if (!wrapper) return;
  const stage = wrapper.querySelector(".anim-demo-stage");
  if (!stage) return;
  stage.classList.remove("playing");
  // Force reflow so the browser registers the class removal
  void stage.offsetWidth;
  stage.classList.add("playing");
}

// ------------------------------------------------------------
// 10. Progressive toggle — .progressive-toggle click handler
// ------------------------------------------------------------
document.querySelectorAll(".progressive-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    const content = toggle.nextElementSibling;
    if (content && content.classList.contains("progressive-content")) {
      const isOpen = toggle.classList.contains("open");
      if (isOpen) {
        content.style.display = "";
      } else {
        content.style.display = "none";
      }
    }
  });
});

// ------------------------------------------------------------
// 11. Switch toggle — .switch click handler
// ------------------------------------------------------------
document.querySelectorAll(".switch").forEach((sw) => {
  sw.addEventListener("click", () => {
    sw.classList.toggle("checked");
    const isChecked = sw.classList.contains("checked");
    sw.setAttribute("aria-checked", isChecked);
  });
});
