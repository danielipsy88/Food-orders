import postgres from "postgres";

const g = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };

export const sql =
  g.__sql ?? (g.__sql = postgres(process.env.DATABASE_URL!, {
    max: 5,
    // Hosted Postgres usually sits behind a connection pooler that cannot keep prepared statements.
    prepare: false,
    onnotice: () => {},
  }));
