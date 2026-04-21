import Link from "next/link";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/learn", label: "Learn" },
];

export function Navbar({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "border-b border-sky-100/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100/90 text-primary">
            <Activity className="h-4 w-5" aria-hidden />
          </span>
          LungLens
        </Link>
        <nav className="flex gap-5 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
