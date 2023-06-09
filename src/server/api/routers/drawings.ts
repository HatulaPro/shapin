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
import { eq, lt, inArray, desc, and } from "drizzle-orm/expressions";

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
        attemptingDate: z.boolean(),
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
                  attempting: new Date(),
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
        date: z.date().optional(),
        cursor: z.date().nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (input.date) {
        const todaysImage = await db
          .select()
          .from(images)
          .where(eq(images.date, input.date))
          .execute();
        if (!todaysImage[0]) {
          throw new TRPCError({
            message: "The challenge for this date does not exist.",
            code: "NOT_FOUND",
          });
        }
      }
      const likesCountQuery = db
        .select({
          post_id: posts.id,
          likesCount: sql<number>`count(${likes.post_id})::int`.as(
            "likesCount"
          ),
        })
        .from(posts)
        .leftJoin(likes, eq(likes.post_id, posts.id))
        .groupBy(posts.id)
        .as("likesCountQuery");

      const uid = ctx.session?.userId || "";
      const didUserLikeQuery = db
        .select({
          post_id: likes.post_id,
          didUserLike: sql<number>`count(${likes.post_id})::int`.as(
            "didUserLike"
          ),
        })
        .from(posts)
        .leftJoin(likes, eq(posts.id, likes.post_id))
        .where(and(eq(posts.id, likes.post_id), eq(likes.user_id, uid)))
        .groupBy(posts.id, likes.post_id)
        .as("didUserLikeQuery");
      const postsRes = await db
        .select({
          post: posts,
          image: images,
          shape: shapes,
          likesCount: likesCountQuery.likesCount,
          liked: didUserLikeQuery.didUserLike,
        })
        .from(posts)
        .leftJoin(shapes, eq(shapes.post_id, posts.id))
        .leftJoin(images, eq(images.date, posts.attempting))
        .leftJoin(likesCountQuery, eq(likesCountQuery.post_id, posts.id))
        .leftJoin(didUserLikeQuery, eq(didUserLikeQuery.post_id, posts.id))
        .where(
          inArray(
            posts.id,
            db
              .select({ id: posts.id })
              .from(posts)
              .where(
                and(
                  lt(posts.created_at, input.cursor ?? new Date()),
                  input.date && eq(posts.attempting, input.date)
                )
              )
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
                liked: boolean;
              }
            >
          >((acc, row) => {
            const { shape, image, post, likesCount, liked } = row;

            if (!acc.has(post.id)) {
              acc.set(post.id, {
                post,
                shapes: [],
                image: null,
                likesCount: 0,
                liked: false,
              });
            }

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const currentEntry = acc.get(post.id)!;
            if (shape) {
              currentEntry.shapes.push(shape);
            }
            if (image) {
              currentEntry.image = image;
            }
            if (likesCount) {
              currentEntry.likesCount = likesCount;
            }
            if (liked) {
              currentEntry.liked = Boolean(liked);
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
