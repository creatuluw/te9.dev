import type { GardenCard, QuickLink } from "./types";
import {
  Code,
  Package,
  Link2,
  FileText,
  Bookmark,
  Heart,
} from "@lucide/svelte";

export const gardenCards: GardenCard[] = [
  {
    icon: Code,
    title: "Dev Playground",
    desc: "Experiments, prototypes, and side projects. A sandbox for trying new technologies and approaches without constraints.",
    tag: "experiments",
  },
  {
    icon: Package,
    title: "Starter Kits",
    desc: "Quick shortcuts to project templates and boilerplate. Jump-start new projects with battle-tested configurations.",
    tag: "templates",
  },
  {
    icon: Link2,
    title: "Link Collection",
    desc: "Curated bookmarks and resources I keep coming back to. Tools, articles, and references worth sharing.",
    tag: "bookmarks",
  },
  {
    icon: Bookmark,
    title: "Personal Preferences",
    desc: "Configs, settings, and preferences I use across projects. A personal reference for consistency.",
    tag: "config",
  },
  {
    icon: FileText,
    title: "Notes & Articles",
    desc: "Personal notes on topics I'm exploring. From technical deep-dives to random interests and learnings.",
    tag: "knowledge",
  },
  {
    icon: Heart,
    title: "Sharing & Resources",
    desc: "Tools, thoughts, and resources shared with the world. If it helped me, maybe it'll help you too.",
    tag: "open",
  },
];

export const quickLinks: QuickLink[] = [
  {
    href: "/digest",
    name: "Digest",
    desc: "Analyzed bookmark digests",
  },
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
