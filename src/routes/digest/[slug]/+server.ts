import { db } from "$lib/server/db";
import { digests } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  const rows = await db
    .select({ html: digests.html, title: digests.title })
    .from(digests)
    .where(eq(digests.slug, params.slug))
    .limit(1);

  if (!rows.length) {
    return new Response("Digest not found", { status: 404 });
  }

  return new Response(rows[0].html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
