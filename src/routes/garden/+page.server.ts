import { db } from "$lib/server/db";
import { gardenEntrance } from "$lib/server/db/schema";
import { eq, asc } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const entrances = await db
    .select({
      id: gardenEntrance.id,
      title: gardenEntrance.title,
      description: gardenEntrance.description,
      tag: gardenEntrance.tag,
      icon: gardenEntrance.icon,
      slug: gardenEntrance.slug,
      href: gardenEntrance.href,
      sortOrder: gardenEntrance.sortOrder,
    })
    .from(gardenEntrance)
    .where(eq(gardenEntrance.isActive, true))
    .orderBy(asc(gardenEntrance.sortOrder));

  return { entrances };
};
