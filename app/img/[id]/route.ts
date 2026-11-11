import { sql } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/img/[id]">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return new Response(null, { status: 404 });
  const [row] = await sql`select image from dishes where id = ${id} and image is not null`;
  if (!row) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(row.image), {
    headers: {
      "Content-Type": "image/jpeg",
      // The URL carries a version, so the bytes behind it never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
