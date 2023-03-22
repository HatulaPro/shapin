import { useClerk } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { CustomSignIn } from "./CustomSignIn";
import { CustomSignUp } from "./CustomSignUp";
import { ProfileImage } from "./ProfileImage";

export const Header = () => {
  const { user } = useClerk();
  return (
    <div className="sticky top-0 left-0 z-[999999] flex w-full gap-2 bg-[#121232] px-6 py-4 text-white">
      <Link href="/" className="hover:underline">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" width={40} height={40} alt="Logo of Shapin" />
          <span className="hidden text-xl sm:block">Shapin</span>
        </div>
      </Link>
      <div className="flex w-full items-center justify-end gap-2">
        {user ? (
          <>
            <ProfileImage src={user.profileImageUrl} />
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
