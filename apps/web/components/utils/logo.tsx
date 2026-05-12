import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      {/* <Donut className="h-6 w-6" /> */}
      <Image alt="logo" src={"./logo.svg"} width={20} height={20} />
    </Link>
  );
}
