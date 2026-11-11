"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { Settings } from "@/lib/data";
import { btnPrimary, card, input, label } from "./ui";

export default function SettingsForm({ s }: { s: Settings }) {
  const [message, action, pending] = useActionState(saveSettings, null);
  const ok = message === "נשמר";
  return (
    <form action={action} className={`${card} space-y-4 p-4`}>
      <h1 className="text-lg font-bold">הגדרות</h1>
      <div>
        <label className={label} htmlFor="business_name">שם העסק (כותרת האתר)</label>
        <input id="business_name" name="business_name" required className={input} defaultValue={s.business_name} />
      </div>
      <div>
        <label className={label} htmlFor="admin_whatsapp">מספר הוואטסאפ לקבלת הזמנות</label>
        <input id="admin_whatsapp" name="admin_whatsapp" type="tel" dir="ltr" placeholder="+420 123 456 789"
          className={`${input} text-right`} defaultValue={s.admin_whatsapp} />
        <p className="mt-1 text-sm text-stone-500">עם קידומת מדינה. בלי מספר, הלקוחות לא יראו כפתור וואטסאפ.</p>
      </div>
      <div>
        <label className={label} htmlFor="pickup_address">כתובת לאיסוף עצמי</label>
        <input id="pickup_address" name="pickup_address" dir="auto" className={input} defaultValue={s.pickup_address} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label} htmlFor="open_hour">איסוף משעה</label>
          <input id="open_hour" name="open_hour" type="number" min={0} max={23} required dir="ltr"
            className={`${input} text-right`} defaultValue={s.open_hour} />
        </div>
        <div>
          <label className={label} htmlFor="close_hour">עד שעה</label>
          <input id="close_hour" name="close_hour" type="number" min={1} max={24} required dir="ltr"
            className={`${input} text-right`} defaultValue={s.close_hour} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="lead_minutes">זמן הכנה מינימלי (בדקות)</label>
        <input id="lead_minutes" name="lead_minutes" type="number" min={0} required dir="ltr"
          className={`${input} text-right`} defaultValue={s.lead_minutes} />
        <p className="mt-1 text-sm text-stone-500">לקוח לא יוכל לבחור מועד קרוב יותר מזה.</p>
      </div>
      <div>
        <label className={label} htmlFor="edit_window_hours">שינוי או ביטול על ידי הלקוח: עד כמה שעות מרגע ההזמנה</label>
        <input id="edit_window_hours" name="edit_window_hours" type="number" min={0} required dir="ltr"
          className={`${input} text-right`} defaultValue={s.edit_window_hours} />
      </div>
      <div>
        <label className={label} htmlFor="closed_message">הודעה ללקוחות כשההזמנות סגורות</label>
        <textarea id="closed_message" name="closed_message" rows={2} className={input} defaultValue={s.closed_message} />
      </div>
      {message && (
        <p role="status" className={`text-sm font-medium ${ok ? "text-green-700" : "text-red-700"}`}>{message}</p>
      )}
      <button disabled={pending} className={`${btnPrimary} w-full`}>{pending ? "שומר…" : "שמירה"}</button>
    </form>
  );
}
