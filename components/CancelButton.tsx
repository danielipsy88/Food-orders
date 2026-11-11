"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder } from "@/app/actions";
import { btnGhost } from "./ui";

export default function CancelButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className={`${btnGhost} text-red-700`}
        onClick={() => {
          if (!confirm("לבטל את ההזמנה?")) return;
          start(async () => {
            const res = await cancelOrder(token);
            if (!res.ok) return setError(res.error);
            router.push(`/o/${token}?s=cancelled`);
            router.refresh();
          });
        }}
      >
        {pending ? "מבטל…" : "ביטול ההזמנה"}
      </button>
      {error && <p role="alert" className="col-span-2 text-sm text-red-700">{error}</p>}
    </>
  );
}
