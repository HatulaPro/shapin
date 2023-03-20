import { HashIcon } from "./icons/HashIcon";

export const SubmissionFor = ({ date }: { date: Date }) => {
  return (
    <p className="text-center text-sm text-indigo-400">
      <HashIcon className="inline-block text-2xl" />
      Submission for <b>{date.toISOString().slice(0, 10)}</b>&apos;s challenge
    </p>
  );
};
