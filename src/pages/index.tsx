import { type NextPage } from "next";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { Editor } from "~/components/Editor";
import { CustomSignIn } from "~/components/CustomSignIn";
import { SignedIn, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { CustomSignUp } from "~/components/CustomSignUp";
import { type ShapeWithoutPostId } from "~/db/schema";
import { api } from "~/utils/api";
import { Loading } from "~/components/Loading";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Shapin</title>
        <meta name="description" content="Shapin home page" />
        <link rel="icon" href="/favicon.ico" />
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
    <div className="sticky top-0 left-0 z-[9999] flex w-full gap-2 bg-[#121232] px-6 py-4 text-white">
      <div className="flex w-full items-center justify-end gap-2">
        {user ? (
          <>
            <Image
              alt="Your profile picture"
              src={user.profileImageUrl}
              className="rounded-full border-[1px] border-white"
              width={36}
              height={36}
            />
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
      count: 5,
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
  return {
    posts: flattenedPosts,
    isLoading: getPostsQuery.isLoading,
  };
};

const PostsViewer = () => {
  const { posts, isLoading } = usePosts();
  return (
    <div className="mx-auto mt-4 flex max-w-md flex-col gap-4">
      {posts?.map((post) => {
        return (
          <div
            key={post.post.id}
            className="rounded-md border-2 border-white p-4"
          >
            <div className="flex items-center gap-2">
              <Image
                alt="Your profile picture"
                src={post.user.profileImageUrl}
                className="rounded-full border-[1px] border-white"
                width={36}
                height={36}
              />
              <span>{post.user.username}</span>
            </div>
            <h3 className="my-2 ml-12 text-xl">{post.post.title}</h3>
            <div className="relative mx-auto my-4 h-80 w-80 rounded-md border-[1px] border-white/20">
              {post.shapes.map((shape) => (
                <PlainShape key={shape.id} shape={shape} />
              ))}
            </div>
          </div>
        );
      })}
      <Loading loading={isLoading} />
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
  const utils = api.useContext();
  const createPostMutation = api.drawings.createDrawing.useMutation({
    onMutate() {
      void utils.drawings.getDrawings.invalidate();
    },
    onSuccess() {
      setTitle("");
      setActive(false);
      setShapes([]);
    },
  });
  console.log(createPostMutation.error?.data?.zodError);
  if (!user) return <></>;
  return (
    <div className="mx-auto max-w-md rounded-md border-2 border-white p-4">
      <div className="flex items-center gap-2">
        <Image
          alt="Your profile picture"
          src={user.profileImageUrl}
          className="rounded-full border-[1px] border-white"
          width={36}
          height={36}
        />
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
      <Editor isActive={isActive} shapes={shapes} setShapes={setShapes} />
      <Loading loading={createPostMutation.isLoading} />
      <button
        className="rounded-md p-2 transition-all hover:bg-white/5 disabled:text-gray-300"
        disabled={createPostMutation.isLoading}
        onClick={() => {
          if (isActive && shapes.length) {
            createPostMutation.mutate({ shapes, title });
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
