# הזמנות אוכל

אתר הזמנות פשוט: לקוחות בוחרים מנות ושולחים הזמנה, והמנהל רואה את כל ההזמנות ומנהל את התפריט.

## הרצה מקומית

1. להעתיק את `.env.example` ל-`.env.local` ולמלא: כתובת Postgres, סיסמת מנהל ומחרוזת סודית.
2. `npm install`
3. `npm run db:setup` (יוצר את הטבלאות; עם `-- --seed` מוסיף מנות לדוגמה)
4. `npm run dev`

- האתר ללקוחות: `/`
- מסך הניהול: `/admin`

## פריסה (Vercel + Neon)

1. ב-Vercel: Add New → Project, ולבחור את הריפו.
2. בפרויקט: Storage → Create Database → Neon. זה מגדיר את `DATABASE_URL` אוטומטית.
3. ב-Settings → Environment Variables להוסיף `ADMIN_PASSWORD` ו-`AUTH_SECRET`.
4. Redeploy. הטבלאות נוצרות אוטומטית בזמן ה-build.
