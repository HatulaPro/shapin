import { eq } from "drizzle-orm/expressions";
import type { NextApiRequest, NextApiResponse } from "next";
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
    res.status(404);
    return res.json({ error: "image not found" });
  } else {
    res.setHeader("cache-control", "max-age=604800");
    return res.redirect(301, result[0].url);
  }
}
