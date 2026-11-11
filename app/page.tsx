import OrderForm from "@/components/OrderForm";
import { getDishes, getSettings } from "@/lib/data";
import { getSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, dishes] = await Promise.all([getSettings(), getDishes()]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <header className="mb-5 text-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">{settings.business_name}</h1>
        {settings.is_open && (
          <p className="mt-1 text-stone-600">בוחרים מנות, ממלאים פרטים ושולחים. זה הכול.</p>
        )}
      </header>

      {!settings.is_open ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-lg">
          {settings.closed_message}
        </p>
      ) : dishes.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-lg">
          התפריט מתעדכן. נחזור בקרוב!
        </p>
      ) : (
        <OrderForm
          dishes={dishes}
          slots={getSlots(settings)}
          pickupAddress={settings.pickup_address}
        />
      )}
    </main>
  );
}
