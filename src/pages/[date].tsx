/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { Header } from "~/components/Header";
import { NotFound } from "~/components/NotFound";
import { PostsViewer } from "~/components/PostsViewer";

export const useRouterDate = () => {
  const router = useRouter();
  const dateString = router.query.date as string | undefined;
  if (!dateString) {
    return { error: "undefined date", date: null } as const;
  }

  const result = new Date(dateString);
  if (isNaN(result.getTime())) {
    return { error: "invalid date", date: null } as const;
  }

  return { error: null, date: result } as const;
};

const ChallengePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Shapin</title>
        <meta name="description" content="Shapin home page" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <Header />
      <ChallengePageMain />
    </>
  );
};

const ChallengePageMain = () => {
  const { date, error } = useRouterDate();
  return (
    <main className="min-h-screen bg-black p-4 text-white">
      {date ? (
        <PostsViewer date={date} />
      ) : (
        error === "invalid date" && <NotFound />
      )}
    </main>
  );
};

export default ChallengePage;
