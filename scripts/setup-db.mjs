// Creates the tables. Run: npm run db:setup   (add --seed for sample dishes)
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  // During a build without a database (for example CI) there is nothing to set up.
  if (process.argv.includes("--if-configured")) process.exit(0);
  throw new Error("DATABASE_URL is not set");
}
const sql = postgres(url, { prepare: false, onnotice: () => {} });

await sql.unsafe(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

if (process.argv.includes("--seed")) {
  const [{ count }] = await sql`select count(*)::int as count from dishes`;
  if (count === 0) {
    const dishes = [
      ["חומוס ביתי", "חומוס טרי עם טחינה, שמן זית וגרגירים. מגיע עם 2 פיתות.", 149],
      ["שניצל בפיתה", "שניצל עוף פריך, חומוס, סלט קצוץ וחמוצים.", 189],
      ["שקשוקה", "שתי ביצים ברוטב עגבניות ופלפלים, עם חלה.", 169],
      ["סביח", "חציל מטוגן, ביצה קשה, טחינה, עמבה וסלט בפיתה.", 159],
      ["מלבי", "מלבי קר עם סירופ ורדים, קוקוס ובוטנים.", 79],
    ];
    let sort = 0;
    for (const [name, description, price] of dishes) {
      await sql`insert into dishes (name, description, price, sort) values (${name}, ${description}, ${price}, ${sort++})`;
    }
    console.log("Seeded sample dishes");
  }
}
console.log("Database ready");
await sql.end();
