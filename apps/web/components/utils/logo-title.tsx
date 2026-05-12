import Image from "next/image";
import Link from "next/link";

export default function LogoTitle() {
  return (
    <Link href={"/dashboard"} className="flex items-center gap-2 pl-4">
      {/* <Donut className="h-6 w-6" /> */}
      <Image alt="logo" src={"./logo.svg"} width={24} height={24} />
      <span className="text-base font-semibold">Quota</span>
    </Link>
  );
}
