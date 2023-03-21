import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "~/db/db";
import {
  type DailyImage,
  type Post,
  type Shape,
  images,
  shapes,
  posts,
  likes,
} from "~/db/schema";
import { eq, lt, inArray, desc } from "drizzle-orm/expressions";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";

export const drawingsRouter = createTRPCRouter({
  createDrawing: protectedProcedure
    .input(
      z.object({
        title: z
          .string()
          .min(4, "Title must contain at least 4 characters")
          .max(128, "Title must contain at most 128 characters"),
        attemptingDate: z
          .date()
          .optional()
          .transform((d) => {
            if (d) {
              d.setHours(0, 0, 0, 0);
            }
            return d;
          }),
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
          .max(20, "The number of shapes can not exceed 20"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      const post = (
        await db
          .insert(posts)
          .values(
            input.attemptingDate
              ? {
                  title: input.title,
                  user_id: userId,
                  attempting: input.attemptingDate,
                }
              : {
                  title: input.title,
                  user_id: userId,
                }
          )
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
      const likesQuery = db
        .select({
          post_id: posts.id,
          likesCount: sql<number>`count(${likes.post_id})::int`.as(
            "likesCount"
          ),
        })
        .from(posts)
        .leftJoin(likes, eq(likes.post_id, posts.id))
        .groupBy(posts.id)
        .as("likesQuery");
      const postsRes = await db
        .select({
          post: posts,
          image: images,
          shape: shapes,
          likesCount: likesQuery.likesCount,
        })
        .from(posts)
        .leftJoin(shapes, eq(shapes.post_id, posts.id))
        .leftJoin(images, eq(images.date, posts.attempting))
        .leftJoin(likesQuery, eq(likesQuery.post_id, posts.id))
        .where(
          inArray(
            posts.id,
            db
              .select({ id: posts.id })
              .from(posts)
              .where(lt(posts.created_at, input.cursor ?? new Date()))
              .orderBy(desc(posts.created_at))
              .limit(input.count)
          )
        )
        .execute();

      const simplifiedPosts = [
        ...postsRes
          .reduce<
            Map<
              number,
              {
                post: Post;
                image: DailyImage | null;
                shapes: Shape[];
                likesCount: number;
              }
            >
          >((acc, row) => {
            const { shape, image, post, likesCount } = row;

            if (!acc.has(post.id)) {
              acc.set(post.id, {
                post,
                shapes: [],
                image: null,
                likesCount: 0,
              });
            }

            if (shape) {
              acc.get(post.id)?.shapes.push(shape);
            }
            if (image) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              acc.get(post.id)!.image = image;
            }
            if (likesCount) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              acc.get(post.id)!.likesCount = likesCount;
            }

            return acc;
          }, new Map())
          .values(),
      ].sort(
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
