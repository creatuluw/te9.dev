import { getGuideSlugs, getGuideBySlug } from "$lib/data/guides";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
    const { slug } = params;

    if (!getGuideSlugs().includes(slug)) {
        throw error(404, "Handleiding niet gevonden");
    }

    const guide = getGuideBySlug(slug);
    if (!guide) {
        throw error(404, "Handleiding niet gevonden");
    }

    return {
        guide,
    };
};
