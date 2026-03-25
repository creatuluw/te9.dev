<script lang="ts">
    // Hero.svelte - Hero section component for the homepage
    // Contains label, title, subtitle, description, CTAs, and decorative elements
</script>

<section class="hero">
    <div class="hero-content">
        <div class="hero-label">
            <span class="label-bracket">[</span>
            <span class="label-text">digital-garden</span>
            <span class="label-bracket">]</span>
        </div>
        <h1 class="hero-title hero-title-single">
            <span class="title-main"
                >te9<span class="title-dot">.</span>dev</span
            >
        </h1>
        <p class="hero-subtitle">
            Playground. Garden. Archive.<br />
            <span class="subtitle-accent">Everything in one place.</span>
        </p>
        <p class="hero-description">
            A personal corner of the web for dev experiments, starter kits,
            notes, tools, and resources. Built to share, designed to grow.
        </p>
        <div class="hero-cta">
            <a href="#garden" class="btn btn-primary">
                <span class="btn-text">explore</span>
                <span class="btn-icon">→</span>
            </a>
            <a
                href="https://patrick.te9.nl/about/"
                class="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
            >
                <span class="btn-text">about me</span>
            </a>
        </div>
    </div>
    <div class="hero-decoration">
        <div class="deco-ring deco-ring-1"></div>
        <div class="deco-ring deco-ring-2"></div>
        <div class="deco-ring deco-ring-3"></div>
    </div>
</section>

<style>
    .hero {
        min-height: calc(100vh - 60px);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding: 4rem 2rem;
        overflow: hidden;
    }

    .hero-content {
        max-width: 800px;
        text-align: center;
        z-index: 1;
        position: relative;
    }

    .hero-label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-family: "Lekton", sans-serif;
    }

    .label-bracket {
        color: #ff9500;
        font-weight: 600;
    }

    .label-text {
        color: #888888;
    }

    .hero-title {
        font-size: clamp(3rem, 8vw, 6rem);
        font-weight: 700;
        line-height: 1;
        margin-bottom: 1.5rem;
        color: #e8e8e8;
        font-family: "Bricolage Grotesque", sans-serif;
    }

    .hero-title-single {
        display: block;
    }

    .title-main {
        display: block;
    }

    .title-dot {
        color: #ff9500;
    }

    .hero-subtitle {
        font-size: 1.25rem;
        color: #888888;
        margin-bottom: 1rem;
        line-height: 1.6;
        font-family: "Lekton", sans-serif;
    }

    .subtitle-accent {
        color: #ff9500;
        font-weight: 500;
    }

    .hero-description {
        font-size: 1rem;
        color: #666666;
        max-width: 600px;
        margin: 0 auto 2rem;
        line-height: 1.7;
        font-family: "Lekton", sans-serif;
    }

    .hero-cta {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 2rem;
        font-size: 0.9375rem;
        font-weight: 500;
        text-decoration: none;
        border-radius: 6px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        border: none;
        font-family: "Lekton", sans-serif;
        text-transform: lowercase;
    }

    .btn-primary {
        position: relative;
        background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
        color: #0a0a0a;
        overflow: hidden;
    }

    .btn-primary::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #ffaa00 0%, #ff8500 100%);
        transition: left 0.3s ease;
    }

    .btn-primary:hover::before {
        left: 0;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(255, 149, 0, 0.3);
    }

    .btn-text {
        position: relative;
        z-index: 1;
    }

    .btn-icon {
        position: relative;
        z-index: 1;
        transition: transform 0.3s ease;
    }

    .btn-primary:hover .btn-icon {
        transform: translateX(4px);
    }

    .btn-secondary {
        background: transparent;
        color: #e8e8e8;
        border: 1px solid #2a2a2a;
    }

    .btn-secondary:hover {
        border-color: #ff9500;
        background: rgba(255, 149, 0, 0.05);
        transform: translateY(-2px);
    }

    .hero-decoration {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        height: 600px;
        pointer-events: none;
        z-index: 1;
    }

    .deco-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        border: 1px solid #2a2a2a;
        opacity: 0.3;
    }

    .deco-ring-1 {
        width: 200px;
        height: 200px;
        animation: pulse-1 11s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    .deco-ring-2 {
        width: 450px;
        height: 450px;
        animation: pulse-2 11s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.4s;
    }

    .deco-ring-3 {
        width: 600px;
        height: 600px;
        animation: pulse-3 11s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.8s;
        border-width: 2px;
    }

    @keyframes pulse-1 {
        0%,
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
            border-color: #2a2a2a;
        }
        27% {
            opacity: 0.15;
            transform: translate(-50%, -50%) scale(1.03);
            border-color: #ff9500;
        }
        38% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
            border-color: #2a2a2a;
        }
    }

    @keyframes pulse-2 {
        0%,
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
            border-color: #2a2a2a;
        }
        27% {
            opacity: 0.12;
            transform: translate(-50%, -50%) scale(1.44);
            border-color: #ff9500;
        }
        38% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
            border-color: #2a2a2a;
        }
    }

    @keyframes pulse-3 {
        0%,
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
            border-color: #2a2a2a;
        }
        27% {
            opacity: 0.12;
            transform: translate(-50%, -50%) scale(2.22);
            border-color: #ff9500;
        }
        38% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
            border-color: #2a2a2a;
        }
    }

    @media (max-width: 768px) {
        .hero {
            padding: 2rem 1rem;
        }

        .hero-cta {
            flex-direction: column;
            align-items: center;
        }

        .btn {
            width: 100%;
            max-width: 280px;
            justify-content: center;
        }
    }
</style>
