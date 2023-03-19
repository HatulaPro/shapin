import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "~/db/db";
import { shapes, posts } from "~/db/schema";
import { asc, eq, lt, inArray } from "drizzle-orm/expressions";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { combineDrizzleData } from "~/utils/general";

export const drawingsRouter = createTRPCRouter({
  createDrawing: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        shapes: z
          .array(
            z.object({
              id: z.number(),
              shape_type: z.enum(["SQUARE", "TRIANGLE", "CIRCLE"]),
              left: z.number(),
              top: z.number(),
              width: z.number(),
              height: z.number(),
              zIndex: z.number(),
              color: z.enum([
                "#000000",
                "#235789",
                "#c1292e",
                "#f1d302",
                "#56e39f",
                "#e574bc",
                "#ffffff",
              ]),
            })
          )
          .max(20),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      const post = (
        await db
          .insert(posts)
          .values({
            title: input.title,
            user_id: userId,
          })
          .returning()
          .execute()
      )[0];
      if (!post) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create post.",
        });
      }
      const insertedShapes = await db
        .insert(shapes)
        .values(
          ...input.shapes.map((s) => ({
            shape_type: s.shape_type,
            left: Math.round(s.left),
            top: Math.round(s.top),
            width: Math.round(s.width),
            height: Math.round(s.height),
            zIndex: Math.round(s.zIndex),
            color: s.color,
            post_id: post.id,
          }))
        )
        .returning()
        .execute();

      return { post, shapes: insertedShapes };
    }),
  getDrawings: publicProcedure
    .input(
      z.object({
        count: z.number().min(4).max(50),
        cursor: z.date().nullish(),
      })
    )
    .query(async ({ input }) => {
      const postsRes = await db
        .select({
          post: posts,
          shapes: shapes,
        })
        .from(posts)
        .leftJoin(shapes, eq(shapes.post_id, posts.id))
        .where(
          inArray(
            posts.id,
            db
              .select({ id: posts.id })
              .from(posts)
              .where(lt(posts.created_at, input.cursor ?? new Date()))
              .orderBy(asc(posts.created_at))
              .limit(input.count)
          )
        )
        .execute();

      const simplifiedPosts = combineDrizzleData({
        data: postsRes,
        combineBy: "post",
        getKey: (post) => post.id,
      }).sort(
        (a, b) => b.post.created_at.getTime() - a.post.created_at.getTime()
      );

      // Getting the users' data
      const users = new Map(
        (
          await clerkClient.users.getUserList({
            userId: [
              ...new Set(simplifiedPosts.map(({ post }) => post.user_id)),
            ],
          })
        ).map((user) => [
          user.id,
          {
            id: user.id,
            username: user.username,
            profileImageUrl: user.profileImageUrl,
          },
        ])
      );

      const postsWithUsers = simplifiedPosts
        .filter(({ post }) => users.has(post.user_id))
        .map((post) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const user = users.get(post.post.user_id)!;
          return {
            ...post,
            shapes: post.shapes,
            user: {
              id: user.id,
              username: user.username,
              profileImageUrl: user.profileImageUrl,
            },
          };
        });

      if (postsWithUsers.length < input.count) {
        return {
          posts: postsWithUsers,
          nextCursor: undefined,
        };
      }
      const nextCursor =
        postsWithUsers.length > 0
          ? postsWithUsers.pop()?.post.created_at
          : undefined;

      return {
        posts: postsWithUsers,
        nextCursor,
      };
    }),
});
