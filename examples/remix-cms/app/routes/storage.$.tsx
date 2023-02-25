import { type LoaderArgs } from "@remix-run/cloudflare";
import { storage } from "superflare";
import invariant from "tiny-invariant";

export async function loader({ params }: LoaderArgs) {
  const pathname = params["*"] as string;

  invariant(pathname, "Pathname is required");

  const [disk, ...path] = pathname.split("/");

  const object = await storage(disk).get(path.join("/"));

  if (!object || !object.body) {
    return new Response("File not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      // TODO: Infer content type from file extension
      // 'Content-Type': file.type,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
