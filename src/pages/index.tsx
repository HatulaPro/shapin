/* eslint-disable @next/next/no-img-element */
import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { Editor } from "~/components/Editor";
import { SignedIn, useClerk } from "@clerk/nextjs";
import { type ShapeWithoutPostId } from "~/db/schema";
import { api } from "~/utils/api";
import { Loading } from "~/components/Loading";
import { getTodaysImageDate, getTodaysImageURL } from "~/utils/general";
import { ProfileImage } from "~/components/ProfileImage";
import { Header } from "~/components/Header";
import { PostsViewer } from "~/components/PostsViewer";

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
        <PostsViewer allowUndefinedDate />
      </main>
    </>
  );
};

export default Home;

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
