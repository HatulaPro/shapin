import { likes } from "./../../../db/schema";
import { z } from "zod";
import { db } from "~/db/db";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const likesRouter = createTRPCRouter({
  likeDrawing: protectedProcedure
    .input(
      z.object({
        post_id: z.number().int(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const uid = ctx.session.userId;
      const result = await db
        .insert(likes)
        .values({
          user_id: uid,
          post_id: input.post_id,
        })
        .returning()
        .execute();
      return result;
    }),
});
