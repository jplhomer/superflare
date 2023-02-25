import { type LoaderArgs } from "@remix-run/cloudflare";
import { servePublicPathFromStorage } from "superflare";

export async function loader({ request }: LoaderArgs) {
  const { pathname } = new URL(request.url);
  return servePublicPathFromStorage(pathname);
}
