import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { Editor } from "~/components/Editor";
import { CustomSignIn } from "~/components/CustomSignIn";
import { SignedIn, useClerk } from "@clerk/nextjs";
import Image from "next/image";

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
    <div className="sticky top-0 left-0 z-[9999] flex w-full gap-2 bg-[#121232] p-4 text-white">
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Image
              alt="Your profile picture"
              src={user.profileImageUrl}
              className="rounded-full border-[1px] border-white"
              width={40}
              height={40}
            />
            <span>{user.username}</span>
          </>
        ) : (
          <CustomSignIn />
        )}
      </div>
    </div>
  );
};

const PostsViewer = () => {
  return (
    <div className="mx-auto mt-4 flex max-w-md flex-col gap-4">
      {[1, 2, 3].map((i) => {
        return (
          <div key={i} className="rounded-md border-2 border-white p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-500" />
              <span>someone</span>
            </div>
            <div className="mx-auto my-4 h-80 w-80 rounded-md bg-yellow-500"></div>
          </div>
        );
      })}
    </div>
  );
};

const CreatePostSection = () => {
  const [isActive, setActive] = useState(false);
  const { user } = useClerk();
  if (!user) return <></>;
  return (
    <div className="mx-auto max-w-md rounded-md border-2 border-white p-4">
      <div className="flex items-center gap-2">
        <Image
          alt="Your profile picture"
          src={user.profileImageUrl}
          className="rounded-full border-[1px] border-white"
          width={40}
          height={40}
        />
        <span>{user.username}</span>
      </div>
      <input
        type="text"
        placeholder="Sup?"
        className="my-2 w-full rounded-md border-2 border-white/20 bg-transparent p-2 text-white outline-none"
      />
      <Editor isActive={isActive} />
      <button
        className="ml-auto block rounded-md p-2 transition-all hover:bg-white/5"
        onClick={() => setActive(!isActive)}
      >
        CREATE
      </button>
    </div>
  );
};
