import { useClerk } from "@clerk/nextjs";

export const CustomSignUp = () => {
  const { openSignUp } = useClerk();

  return (
    <div className="flex flex-col items-center justify-center">
      <button onClick={() => openSignUp()}>Sign Up</button>
    </div>
  );
};
