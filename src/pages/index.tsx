/* eslint-disable @next/next/no-img-element */
import { type NextPage } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { Editor } from "~/components/Editor";
import { CustomSignIn } from "~/components/CustomSignIn";
import { SignedIn, useClerk } from "@clerk/nextjs";
import { CustomSignUp } from "~/components/CustomSignUp";
import { type ShapeWithoutPostId } from "~/db/schema";
import { api } from "~/utils/api";
import { Loading } from "~/components/Loading";
import {
  cx,
  getTodaysImageDate,
  getTodaysImageURL,
  timeAgo,
} from "~/utils/general";
import { DraggableBackground } from "~/components/DraggableBackground";
import { SubmissionFor } from "~/components/SubmissionFor";
import { ProfileImage } from "~/components/ProfileImage";
import { LikeIcon } from "~/components/icons/LikeIcon";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Shapin</title>
        <meta name="description" content="Shapin home page" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <Header />
      <main className="min-h-screen bg-black p-4 text-white">
        <SignedIn>
          <CreatePostSection />
        </SignedIn>
        <PostsViewer />
      </main>
    </>
  );
};

export default Home;

const Header = () => {
  const { user } = useClerk();
  return (
    <div className="sticky top-0 left-0 z-[999999] flex w-full gap-2 bg-[#121232] px-6 py-4 text-white">
      <div className="flex w-full items-center justify-end gap-2">
        {user ? (
          <>
            <ProfileImage src={user.profileImageUrl} />
            <span>{user.username}</span>
          </>
        ) : (
          <>
            <CustomSignIn />
            <CustomSignUp />
          </>
        )}
      </div>
    </div>
  );
};

const usePosts = () => {
  const getPostsQuery = api.drawings.getDrawings.useInfiniteQuery(
    {
      count: 15,
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

const PostsViewer = () => {
  const { posts, isLoading, updatePostOptimistic } = usePosts();

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

const CreatePostSection = () => {
  const [isActive, setActive] = useState(false);
  const { user } = useClerk();
  const [shapes, setShapes] = useState<ShapeWithoutPostId[]>([]);
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState<string | null>(
    getTodaysImageURL()
  );
  const utils = api.useContext();
  const createPostMutation = api.drawings.createDrawing.useMutation({
    onSuccess() {
      void utils.drawings.getDrawings.invalidate();
      setTitle("");
      setActive(false);
      setShapes([]);
      setBackground(getTodaysImageURL());
    },
  });

  if (!user) return <></>;
  return (
    <div className="mx-auto max-w-md rounded-md border-2 border-white p-4">
      <div className="flex items-center gap-2">
        <ProfileImage src={user.profileImageUrl} />
        <span>{user.username}</span>
      </div>
      <input
        type="text"
        placeholder="Sup?"
        className="my-2 w-full rounded-md border-2 border-white/20 bg-transparent p-2 text-white outline-none"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
      />
      <span className="text-sm text-red-400">
        {createPostMutation.error?.data?.zodError?.fieldErrors["title"]}
      </span>
      <Editor
        isActive={isActive}
        shapes={shapes}
        setShapes={setShapes}
        background={background}
        setBackground={setBackground}
      />
      <Loading loading={createPostMutation.isLoading} />
      <button
        className="rounded-md p-2 transition-all hover:bg-white/5 disabled:text-gray-300"
        disabled={createPostMutation.isLoading}
        onClick={() => {
          if (isActive && shapes.length) {
            createPostMutation.mutate({
              shapes,
              title,
              attemptingDate:
                background === getTodaysImageURL()
                  ? getTodaysImageDate()
                  : undefined,
            });
          } else {
            setActive(!isActive);
          }
        }}
      >
        CREATE
      </button>
      {isActive && shapes.length > 0 && (
        <button
          className="rounded-md p-2 transition-all hover:bg-white/5 disabled:text-gray-300"
          disabled={createPostMutation.isLoading}
          onClick={() => {
            setShapes([]);
          }}
        >
          CLEAR
        </button>
      )}
    </div>
  );
};
