import { searchIndex } from "@/lib/data/search-index";

/** The quick search's list, fetched once by the browser when the search first opens. Public titles and addresses only. */
export async function GET() {
  return Response.json(await searchIndex(), { headers: { "cache-control": "public, max-age=300" } });
}
