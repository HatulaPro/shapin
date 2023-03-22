import { useClerk } from "@clerk/nextjs";
import { CustomSignIn } from "./CustomSignIn";
import { CustomSignUp } from "./CustomSignUp";
import { ProfileImage } from "./ProfileImage";

export const Header = () => {
  const { user } = useClerk();
  return (
    <div className="sticky top-0 left-0 z-[999999] flex w-full gap-2 bg-[#121232] px-6 py-4 text-white">
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
