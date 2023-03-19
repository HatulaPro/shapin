import { cx } from "~/utils/general";

export const Loading = ({ loading }: { loading: boolean }) => {
  return (
    <>
      <div
        className={cx(
          "m-auto animate-spin rounded-full border-2 border-white border-b-transparent transition-all",
          loading ? "h-6 w-6 opacity-100" : "h-0 w-0 opacity-0"
        )}
      />
    </>
  );
};
