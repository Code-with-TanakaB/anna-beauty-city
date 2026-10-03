import { db } from "@/lib/db";
// Fixed-window limiter stored in Postgres (one atomic upsert). Returns true while under the limit.
export async function limit(key: string, max: number, windowSec: number) {
  const r = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, now() + (${windowSec}::int * interval '1 second'))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < now() THEN now() + (${windowSec}::int * interval '1 second') ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  return r[0].count <= max;
}
