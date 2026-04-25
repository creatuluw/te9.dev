import { homepageGuide, homepageMeta } from "./homepage";
import { processesGuide, processesMeta } from "./processes";
import { casesGuide, casesMeta } from "./cases";
import { workGuide, workMeta } from "./work";
import { helpGuide, helpMeta } from "./help";
import { accountGuide, accountMeta } from "./account";
import { messagesGuide, messagesMeta } from "./messages";

export interface GuideMeta {
    slug: string;
    title: string;
    description: string;
    icon: string;
    tasks: string[];
}

export interface Guide {
    meta: GuideMeta;
    content: string;
}

const guides: Guide[] = [
    { meta: homepageMeta, content: homepageGuide },
    { meta: processesMeta, content: processesGuide },
    { meta: casesMeta, content: casesGuide },
    { meta: workMeta, content: workGuide },
    { meta: helpMeta, content: helpGuide },
    { meta: accountMeta, content: accountGuide },
    { meta: messagesMeta, content: messagesGuide },
];

export function getAllGuides(): GuideMeta[] {
    return guides.map((g) => g.meta);
}

export function getGuideBySlug(slug: string): Guide | undefined {
    return guides.find((g) => g.meta.slug === slug);
}

export function getGuideSlugs(): string[] {
    return guides.map((g) => g.meta.slug);
}
