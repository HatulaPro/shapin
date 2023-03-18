import { useClerk } from "@clerk/nextjs";

export const CustomSignIn = () => {
  const { openSignIn } = useClerk();

  return (
    <div className="flex flex-col items-center justify-center">
      <button onClick={() => openSignIn()}>Sign In</button>
    </div>
  );
};
