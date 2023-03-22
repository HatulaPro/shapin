import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/db/db";
import { images } from "~/db/schema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const image = await fetch("https://source.unsplash.com/random/256x256/?", {
    redirect: "follow",
  });

  const url = image.url;
  try {
    const result = (
      await db
        .insert(images)
        .values({
          url,
        })
        .returning()
        .execute()
    )[0];

    if (!result) {
      return res.json({
        success: false,
        error: "An error has occured",
      });
    }
    return res.json({ success: true, result });
  } catch {
    return res.json({
      success: false,
      error: "Image already exists",
    });
  }
}
