"use client";

import { useEffect } from "react";

function backendHealthUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/health`;
}

export function BackendWarmup() {
  useEffect(() => {
    const healthUrl = backendHealthUrl();
    if (!healthUrl) return;
    fetch(healthUrl).catch(() => {});
  }, []);

  return null;
}
