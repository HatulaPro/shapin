import { eq } from "drizzle-orm/expressions";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { db } from "~/db/db";
import { type Post, posts, shapes, type ShapeWithoutPostId } from "~/db/schema";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const postId = z.number().parse(parseInt(req.query.post_id as string));
    const result = await db
      .select({
        post: posts,
        shape: {
          id: shapes.id,
          left: shapes.left,
          top: shapes.top,
          color: shapes.color,
          width: shapes.width,
          height: shapes.height,
          zIndex: shapes.zIndex,
          shape_type: shapes.shape_type,
        },
      })
      .from(posts)
      .leftJoin(shapes, eq(shapes.post_id, posts.id))
      .where(eq(posts.id, postId))
      .execute();
    if (!result.length) return res.json({ post: null, error: "not found" });
    const reduced = result.reduce<{ post: Post; shapes: ShapeWithoutPostId[] }>(
      (acc, row) => {
        const { shape, post } = row;
        if (shape) {
          acc.shapes.push(shape);
        }
        if (post) {
          acc.post = post;
        }
        return acc;
      },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { post: result[0]!.post, shapes: [] }
    );

    return res.json({ post: reduced, error: null });
  } catch {
    return res.json({ post: null, error: "unknown" });
  }
}
