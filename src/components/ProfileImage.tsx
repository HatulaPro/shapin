import Image from "next/image";

export const ProfileImage = ({ src, alt }: { src: string; alt?: string }) => {
  return (
    <Image
      alt={alt ?? "Your profile picture"}
      src={src}
      className="rounded-full border-[1px] border-white"
      width={36}
      height={36}
    />
  );
};
