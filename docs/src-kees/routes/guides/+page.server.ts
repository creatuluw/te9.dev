import { getAllGuides } from "$lib/data/guides";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    return {
        guides: getAllGuides(),
    };
};
