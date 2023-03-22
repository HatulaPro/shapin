import Link from "next/link";
import { HashIcon } from "./icons/HashIcon";

export const SubmissionFor = ({ date }: { date: Date }) => {
  const dateString = date.toISOString().slice(0, 10);
  return (
    <Link
      className="group block text-center text-sm text-indigo-400"
      href={dateString}
    >
      <HashIcon className="inline-block text-2xl" />
      Submission for <b className="group-hover:underline">{dateString}</b>
      &apos;s challenge
    </Link>
  );
};
