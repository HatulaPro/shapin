import Image from "next/image";
import Link from "next/link";

export const NotFound = ({ message }: { message?: string }) => {
  return (
    <div className="my-auto grid place-items-center">
      <Image src="/404.png" width={256} height={256} alt="404 Image" />
      <p>
        {message ??
          "Not sure what you were looking for, but we couldn&apos;t find it."}
      </p>
      <Link href="/" className="text-indigo-400 hover:underline">
        Go Back
      </Link>
    </div>
  );
};
