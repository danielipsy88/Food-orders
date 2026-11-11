"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { btnPrimary, card, input, label } from "@/components/ui";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm items-center px-4">
      <form action={action} className={`${card} w-full space-y-4 p-5`}>
        <h1 className="text-xl font-bold">כניסת מנהל</h1>
        <div>
          <label className={label} htmlFor="password">סיסמה</label>
          <input id="password" name="password" type="password" required autoFocus dir="ltr"
            autoComplete="current-password" className={input} />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
        <button disabled={pending} className={`${btnPrimary} w-full`}>
          {pending ? "בודק…" : "כניסה"}
        </button>
      </form>
    </main>
  );
}
