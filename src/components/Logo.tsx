import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/logo.jpeg"
      alt="Memoir"
      width={150}
      height={150}
      priority
      className="h-10 w-10 object-cover rounded-full"
    />
  );
}
