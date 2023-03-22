import { useClerk } from "@clerk/nextjs";
import { useEffect, useMemo } from "react";
import type { ShapeWithoutPostId } from "~/db/schema";
import { api } from "~/utils/api";
import { timeAgo, cx } from "~/utils/general";
import { DraggableBackground } from "./DraggableBackground";
import { LikeIcon } from "./icons/LikeIcon";
import { Loading } from "./Loading";
import { ProfileImage } from "./ProfileImage";
import { SubmissionFor } from "./SubmissionFor";

export const usePosts = (date?: Date) => {
  const getPostsQuery = api.drawings.getDrawings.useInfiniteQuery(
    {
      count: 15,
      date: date,
    },
    {
      getNextPageParam: (lastData) => lastData.nextCursor,
    }
  );

  useEffect(() => {
    const listener = () => {
      if (
        getPostsQuery.isLoading ||
        getPostsQuery.isFetchingNextPage ||
        !getPostsQuery.hasNextPage
      )
        return;
      if (
        window.innerHeight + window.scrollY + 800 >
        document.body.offsetHeight
      ) {
        void getPostsQuery.fetchNextPage();
      }
    };
    window.addEventListener("scroll", listener);

    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [getPostsQuery]);

  const flattenedPosts = useMemo(() => {
    return (
      getPostsQuery.data?.pages.reduce<
        (typeof getPostsQuery)["data"]["pages"][number]["posts"]
      >((acc, cur) => {
        acc.push(...cur.posts);
        return acc;
      }, []) || []
    );
  }, [getPostsQuery]);

  const utils = api.useContext();
  function updatePostOptimistic(
    id: number,
    modifier: (
      p: (typeof flattenedPosts)[number]
    ) => (typeof flattenedPosts)[number]
  ) {
    utils.drawings.getDrawings.setInfiniteData({ count: 15 }, (data) => {
      if (!data) return data;
      return {
        ...data,
        pages: data.pages.map((page) => {
          return {
            ...page,
            posts: page.posts.map((post) => {
              if (post.post.id === id) {
                return modifier(post);
              }
              return post;
            }),
          };
        }),
      };
    });
  }

  return {
    posts: flattenedPosts,
    isLoading: getPostsQuery.isLoading,
    updatePostOptimistic,
  };
};

export const PostsViewer = ({ date }: { date?: Date }) => {
  const { posts, isLoading, updatePostOptimistic } = usePosts(date);

  return (
    <div className="mx-auto mt-4 flex max-w-md flex-col gap-4">
      {posts?.map((post) => {
        return (
          <div
            key={post.post.id}
            className="rounded-md border-2 border-white p-4"
          >
            <div className="flex items-center gap-2">
              <ProfileImage
                alt={`${post.user.username ?? "someone"}'s profile picture`}
                src={post.user.profileImageUrl}
              />
              <span className="text-base">{post.user.username}</span>
              <span className="text-xs text-gray-300">
                {timeAgo(post.post.created_at)}
              </span>
            </div>
            <h3 className="my-2 ml-12 text-xl">{post.post.title}</h3>

            {post.image ? (
              <>
                <DraggableBackground>
                  <>
                    {post.shapes.map((shape) => (
                      <PlainShape key={shape.id} shape={shape} />
                    ))}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image.url}
                      className="h-full w-full"
                      alt="That day's image"
                    />
                  </>
                </DraggableBackground>
              </>
            ) : (
              <div className="relative mx-auto my-4 h-80 w-80 overflow-hidden rounded-md border-[1px] border-white/20">
                {post.shapes.map((shape) => (
                  <PlainShape key={shape.id} shape={shape} />
                ))}
              </div>
            )}
            {post.post.attempting && (
              <SubmissionFor date={post.post.attempting} />
            )}
            <PostSocialSection
              postId={post.post.id}
              likesCount={post.likesCount}
              liked={post.liked}
              updatePost={updatePostOptimistic}
            />
          </div>
        );
      })}
      <Loading loading={isLoading} />
    </div>
  );
};

const PostSocialSection = ({
  postId,
  likesCount,
  liked,
  updatePost,
}: {
  postId: number;
  likesCount: number;
  liked: boolean;
  updatePost: ReturnType<typeof usePosts>["updatePostOptimistic"];
}) => {
  const { user } = useClerk();
  const likePostMutation = api.likes.likeDrawing.useMutation({
    onMutate({ post_id }) {
      updatePost(post_id, (p) => ({
        ...p,
        liked: true,
        likesCount: p.likesCount + 1,
      }));
    },
  });

  const unlikePostMutation = api.likes.unlikeDrawing.useMutation({
    onMutate({ post_id }) {
      updatePost(post_id, (p) => ({
        ...p,
        liked: false,
        likesCount: p.likesCount - 1,
      }));
    },
  });

  return (
    <div className="flex items-center justify-center p-1">
      <button
        disabled={!Boolean(user)}
        className="flex items-center gap-1 rounded-md p-1 text-lg transition-all enabled:hover:bg-white/10"
        onClick={() => {
          if (liked) {
            unlikePostMutation.mutate({ post_id: postId });
          } else {
            likePostMutation.mutate({ post_id: postId });
          }
        }}
      >
        <div className="relative grid place-items-center">
          {liked &&
            [0, 1, 2, 3, 4, 5].map((x) => (
              <div
                key={x}
                className={cx(
                  "like-animation absolute z-20 h-3 w-0.5 bg-red-500 transition-all"
                )}
                style={
                  {
                    "--rotate": `${60 * x}deg`,
                  } as React.CSSProperties
                }
              ></div>
            ))}
          <LikeIcon
            className={cx("text-2xl", liked ? "text-red-500" : "text-red-200")}
          />
        </div>
        {likesCount}
      </button>
    </div>
  );
};

export const PlainShape = ({ shape }: { shape: ShapeWithoutPostId }) => {
  return (
    <div
      className="absolute"
      style={{
        top: shape.top,
        left: shape.left,
        width: shape.width,
        height: shape.height,
        zIndex: shape.zIndex,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
      >
        {shape.shape_type === "SQUARE" ? (
          <rect x="0" y="0" width="100" height="100" fill={shape.color} />
        ) : shape.shape_type === "TRIANGLE" ? (
          <polygon points="50 15, 100 100, 0 100" fill={shape.color} />
        ) : (
          <circle cx="50" cy="50" r="50" fill={shape.color} />
        )}
      </svg>
    </div>
  );
};
