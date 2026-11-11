"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the page data on a timer so new orders show up without a reload. */
export default function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
