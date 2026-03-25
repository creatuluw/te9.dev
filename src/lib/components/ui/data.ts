import type { GardenCard, QuickLink } from './types';

export const gardenCards: GardenCard[] = [
    {
        paths: [
            { d: "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" },
            { d: "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" },
            { d: "M7 21h10" },
            { d: "M12 3v18" },
            { d: "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" },
        ],
        title: "Dev Playground",
        desc: "Experiments, prototypes, and side projects. A sandbox for trying new technologies and approaches without constraints.",
        tag: "experiments",
    },
    {
        paths: [
            { d: "M12 3v18" },
            {
                rect: {
                    x: "4",
                    y: "8",
                    width: "16",
                    height: "12",
                    rx: "2",
                },
            },
            { d: "m8 12 4 4 4-4" },
        ],
        title: "Starter Kits",
        desc: "Quick shortcuts to project templates and boilerplate. Jump-start new projects with battle-tested configurations.",
        tag: "templates",
    },
    {
        paths: [
            {
                d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
            },
            {
                d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
            },
        ],
        title: "Link Collection",
        desc: "Curated bookmarks and resources I keep coming back to. Tools, articles, and references worth sharing.",
        tag: "bookmarks",
    },
    {
        paths: [
            {
                d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
            },
            { polyline: { points: "17 21 17 13 7 13 7 21" } },
            { polyline: { points: "7 3 7 8 15 8" } },
        ],
        title: "Personal Preferences",
        desc: "Configs, settings, and preferences I use across projects. A personal reference for consistency.",
        tag: "config",
    },
    {
        paths: [
            {
                d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",
            },
            { polyline: { points: "14 2 14 8 20 8" } },
            { line: { x1: "16", y1: "13", x2: "8", y2: "13" } },
            { line: { x1: "16", y1: "17", x2: "8", y2: "17" } },
        ],
        title: "Notes & Articles",
        desc: "Personal notes on topics I'm exploring. From technical deep-dives to random interests and learnings.",
        tag: "knowledge",
    },
    {
        paths: [
            { circle: { cx: "12", cy: "12", r: "10" } },
            { d: "M12 16v-4" },
            { d: "M12 8h.01" },
        ],
        title: "Sharing & Resources",
        desc: "Tools, thoughts, and resources shared with the world. If it helped me, maybe it'll help you too.",
        tag: "open",
    },
];

export const quickLinks: QuickLink[] = [
    {
        href: "https://patrick.te9.nl",
        name: "patrick.te9.nl",
        desc: "Main personal site",
    },
    {
        href: "https://patrick.te9.nl/wip/",
        name: "Work in progress",
        desc: "Building and testing",
    },
    {
        href: "https://te9.dev/blog/",
        name: "Blog",
        desc: "Thoughts & writings",
    },
    {
        href: "https://patrick.te9.nl/resume/",
        name: "Resume",
        desc: "Work experience",
    },
    {
        href: "https://github.com/creatuluw",
        name: "GitHub",
        desc: "@creatuluw",
    },
];
