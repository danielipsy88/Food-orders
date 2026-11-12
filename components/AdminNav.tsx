"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "הזמנות" },
  { href: "/admin/summary", label: "מה להכין" },
  { href: "/admin/menu", label: "תפריט" },
  { href: "/admin/stats", label: "סטטיסטיקה" },
  { href: "/admin/settings", label: "הגדרות" },
];

export default function AdminNav({ newCount }: { newCount: number }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${
              active ? "bg-ink text-white" : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            {t.label}
            {t.href === "/admin" && newCount > 0 && (
              <span className="ms-1.5 rounded-full bg-brand px-1.5 text-xs text-white">{newCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
