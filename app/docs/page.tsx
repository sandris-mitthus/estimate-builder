import WikiPage, { generateMetadata as generateWikiMetadata } from "@/app/wiki/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return generateWikiMetadata();
}

export default WikiPage;
