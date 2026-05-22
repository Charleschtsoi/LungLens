"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useAppMotion } from "@/lib/app-motion";
import { FreshUploadLink } from "@/components/upload/FreshUploadLink";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useI18n } from "@/hooks/useI18n";

const links = [
  { href: "/", key: "nav.home" as const },
  { href: "/upload", key: "nav.upload" as const },
  { href: "/learn", key: "nav.learn" as const },
  { href: "/about", key: "nav.about" as const },
  { href: "/pitch", key: "nav.pitch" as const },
];

export function Navbar({ className }: { className?: string }) {
  const { t } = useI18n();
  const { navbarDropIn } = useAppMotion();
  return (
    <motion.header
      initial={navbarDropIn.initial}
      animate={navbarDropIn.animate}
      transition={navbarDropIn.transition}
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
        <div className="flex flex-wrap items-center gap-3">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          {links.map((l) =>
            l.href === "/upload" ? (
              <FreshUploadLink
                key={l.href}
                href={l.href}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {t(l.key)}
              </FreshUploadLink>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {t(l.key)}
              </Link>
            ),
          )}
        </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </motion.header>
  );
}
