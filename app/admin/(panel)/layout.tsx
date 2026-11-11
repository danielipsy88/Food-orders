import AdminNav from "@/components/AdminNav";
import { logout, setOpen } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { getOrderCounts, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "ניהול הזמנות", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const [settings, counts] = await Promise.all([getSettings(), getOrderCounts()]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10">
      <header className="sticky top-0 z-10 -mx-4 mb-4 space-y-2 border-b border-stone-200 bg-cream/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <form action={setOpen.bind(null, !settings.is_open)}>
            <button
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                settings.is_open ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
              title="לחיצה משנה את המצב"
            >
              {settings.is_open ? "● פתוח להזמנות" : "● סגור להזמנות"}
            </button>
          </form>
          <form action={logout}>
            <button className="text-sm text-stone-500 underline">יציאה</button>
          </form>
        </div>
        <AdminNav newCount={counts.new} />
      </header>
      {children}
    </div>
  );
}
