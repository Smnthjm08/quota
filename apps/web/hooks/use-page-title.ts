import { usePathname } from "next/navigation";

export function usePageTitle(): string {
  const pathname = usePathname();

  // Extract the last segment from the pathname
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "dashboard";

  // Convert kebab-case to Title Case
  const titleCase = lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return titleCase;
}
