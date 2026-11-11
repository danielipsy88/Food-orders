# הזמנות אוכל

אתר הזמנות פשוט: לקוחות בוחרים מנות ושולחים הזמנה, והמנהל רואה את כל ההזמנות ומנהל את התפריט.

## הרצה מקומית

1. להעתיק את `.env.example` ל-`.env.local` ולמלא: כתובת Postgres, סיסמת מנהל ומחרוזת סודית.
2. `npm install`
3. `npm run db:setup` (יוצר את הטבלאות; עם `-- --seed` מוסיף מנות לדוגמה)
4. `npm run dev`

- האתר ללקוחות: `/`
- מסך הניהול: `/admin`

## פריסה (Netlify + Neon)

1. ב-Neon: ליצור פרויקט ולהעתיק את ה-Connection string.
2. ב-Netlify: Add new project → Import an existing project, ולבחור את הריפו.
3. להגדיר שלושה משתני סביבה: `DATABASE_URL` (המחרוזת מ-Neon), `ADMIN_PASSWORD` ו-`AUTH_SECRET`.
4. Deploy. הטבלאות נוצרות אוטומטית בזמן ה-build.
