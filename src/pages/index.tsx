import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { Editor } from "~/components/Editor";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Shapin</title>
        <meta name="description" content="Shapin home page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <Header /> */}
      <main className="min-h-screen bg-black p-4 text-white">
        <CreatePostSection />
        <PostsViewer />
      </main>
    </>
  );
};

export default Home;

// const Header = () => {
//   return (
//     <div className="fixed top-0 left-0 flex w-full gap-2 bg-[#121232] p-4 text-white">
//       <div className="flex items-center gap-2">
//         <div className="h-10 w-10 rounded-full border-2 border-white bg-yellow-400" />
//         <span>my_username</span>
//       </div>
//     </div>
//   );
// };

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
  return (
    <div className="mx-auto max-w-md rounded-md border-2 border-white p-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-green-500" />
        <span>someone</span>
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
