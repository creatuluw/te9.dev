<script lang="ts">
    import { page } from "$app/stores";
    import { ExternalLink } from "@lucide/svelte";
    // Terminal typing effect
    let typedText = $state("");
    const fullText = "te9.dev";
    let cursorVisible = $state(true);

    // Active state for nav items
    let gardenClass = $derived(
        $page.url.pathname === "/garden"
            ? "text-[#e8e8e8] after:w-full"
            : "text-[#888888] after:w-0",
    );

    // Cursor blink
    $effect(() => {
        const interval = setInterval(() => {
            cursorVisible = !cursorVisible;
        }, 500);
        return () => clearInterval(interval);
    });

    // Typing effect
    $effect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < fullText.length) {
                typedText = fullText.slice(0, i + 1);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    });

    // Nav scroll state
    let navScrolled = $state(false);

    function handleScroll() {
        navScrolled = window.scrollY > 100;
    }

    $effect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    });
</script>

<nav
    class={`fixed top-0 left-0 right-0 z-1000 transition-all duration-300 border-b border-[#2a2a2a] outline-none ${navScrolled ? "bg-[#0a0a0a] backdrop-blur-[10px] shadow-lg" : "bg-[#0a0a0a]"}`}
>
    <div class="w-full px-8 py-0 flex items-center justify-between h-[60px]">
        <a
            href="/"
            aria-label="Home"
            class="font-[JetBrains_Mono] text-[1rem] flex items-center gap-[0.25rem] no-underline text-inherit hover:text-[#ff9500] transition-colors"
        >
            <span class="text-[#ff9500] font-bold">›</span>
            <span class="text-[#e8e8e8] font-medium">{typedText}</span>
            <span
                class={`text-[#ff9500] ${cursorVisible ? "opacity-100" : "opacity-0"}`}
                >_</span
            >
        </a>
        <div class="font-[Lekton] text-[0.875rem] flex items-center gap-8">
            <a
                href="/garden"
                class="lowercase no-underline transition-colors hover:text-[#e8e8e8] relative after:absolute after:bottom-[-4px] after:left-0 after:h-px after:bg-[#ff9500] after:transition-all after:duration-300 {gardenClass}"
                >garden</a
            >
            <a
                href="/digest"
                class="lowercase no-underline transition-colors text-[#888888] hover:text-[#e8e8e8] relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-px after:bg-[#ff9500] after:transition-all after:duration-300 hover:after:w-full"
                >digest</a
            >
            <a
                href="#links"
                class="text-[#888888] lowercase no-underline transition-colors hover:text-[#e8e8e8] relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-px after:bg-[#ff9500] after:transition-all after:duration-300 hover:after:w-full"
                >links</a
            >
            <a
                href="https://patrick.te9.nl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[#888888] lowercase no-underline transition-colors hover:text-[#e8e8e8] flex items-center gap-1"
            >
                patrick.te9.nl<ExternalLink size={12} />
            </a>
        </div>
    </div>
</nav>
