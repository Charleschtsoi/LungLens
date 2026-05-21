"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useAppStore } from "@/store/useAppStore";

type FreshUploadLinkProps = ComponentProps<typeof Link>;

/** Navigates to `/upload` and clears prior session so the gate → privacy → upload flow restarts. */
export function FreshUploadLink({ onClick, href = "/upload", ...props }: FreshUploadLinkProps) {
  const resetUploadFlow = useAppStore((s) => s.resetUploadFlow);

  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        if (href === "/upload") {
          resetUploadFlow();
        }
        onClick?.(e);
      }}
    />
  );
}
