/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Header } from "~/components/Header";
import { ArrowRightIcon } from "~/components/icons/ArrowRight";
import { NotFound } from "~/components/NotFound";
import { PostsViewer } from "~/components/PostsViewer";
import {
  formatDate,
  getImageURLByDate,
  getTodaysImageDate,
} from "~/utils/general";

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
        <>
          <ChallengeInto date={date} />
          <PostsViewer date={date} />
        </>
      ) : (
        error === "invalid date" && <NotFound />
      )}
    </main>
  );
};

const ChallengeInto = ({ date }: { date: Date }) => {
  const dateString = formatDate(date);
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-3xl">
        <b className="text-indigo-400">{dateString}</b>&apos;s Challenge
      </h1>
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getImageURLByDate(date)}
          width={320}
          height={320}
          alt={`The image for ${dateString}`}
          className="rounded-md"
          onError={() => void router.replace("/")}
        />
        <div className="flex flex-col gap-2">
          {dateString === formatDate(getTodaysImageDate()) ? (
            <>
              <p>View our artists&apos; creations!</p>
              <Link href="/" className="group mt-auto w-fit hover:underline">
                <button className="flex items-center gap-2 rounded-md bg-white/10 p-1 px-3 transition-all group-hover:bg-white/20">
                  Create{" "}
                  <ArrowRightIcon className="transition-all group-hover:translate-x-1" />
                </button>
              </Link>
              <span className="ml-auto w-fit rounded-full bg-green-800 py-1 px-2 text-sm font-bold">
                SUBMISSIONS ARE OPEN
              </span>
            </>
          ) : (
            <>
              <p>View our artists&apos; creations!</p>
              <span className="mt-auto ml-auto w-fit rounded-full bg-red-800 py-1 px-2 text-sm font-bold">
                SUBMISSIONS ARE CLOSED
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengePage;
