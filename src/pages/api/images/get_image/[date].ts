import { eq } from "drizzle-orm/expressions";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { db } from "~/db/db";
import { images } from "~/db/schema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const dateString = req.query.date as string;
  const date = new Date(dateString);

  const result = await db
    .select({
      url: images.url,
    })
    .from(images)
    .where(eq(images.date, date))
    .execute();

  if (!result[0]) {
    // Create new image if time is one day away
    if (Math.abs(date.getTime() - new Date().getTime()) < 1000 * 60 * 60 * 24) {
      const parser = z.discriminatedUnion("success", [
        z.object({
          success: z.literal(true),
          result: z.object({ url: z.string(), date: z.string() }),
        }),
        z.object({ success: z.literal(false), error: z.string() }),
      ]);
      const newImageResponse = parser.parse(
        await (
          await fetch(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            `http://${req.headers.host!}/api/images/set_todays_image`
          )
        ).json()
      );

      if (newImageResponse.success) {
        res.setHeader("cache-control", "max-age=604800");
        return res.redirect(301, newImageResponse.result.url);
      }
    }
  } else {
    res.setHeader("cache-control", "max-age=604800");
    return res.redirect(301, result[0].url);
  }
  res.status(404);
  return res.json({ error: "image not found" });
}
