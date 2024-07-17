import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { servePublicPathFromStorage } from "superflare";

export async function loader({ request }: LoaderFunctionArgs) {
  const { pathname } = new URL(request.url);
  return servePublicPathFromStorage(pathname);
}
