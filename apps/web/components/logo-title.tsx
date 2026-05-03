import { Donut } from "lucide-react";
import Link from "next/link";

export default function LogoTitle() {
  return (
    <Link href={"/dashboard"} className="flex items-center gap-2 pl-4">
      <Donut className="h-6 w-6" />
      <span className="text-base font-semibold">Acme Inc.</span>
    </Link>
  );
}
