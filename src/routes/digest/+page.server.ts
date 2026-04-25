import { db } from "$lib/server/db";
import { digests } from "$lib/server/db/schema";
import { desc } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const items = await db
    .select({
      id: digests.id,
      type: digests.type,
      title: digests.title,
      slug: digests.slug,
      entryCount: digests.entryCount,
      createdAt: digests.createdAt,
      emailSent: digests.emailSent,
    })
    .from(digests)
    .orderBy(desc(digests.createdAt));

  return { digests: items };
};
