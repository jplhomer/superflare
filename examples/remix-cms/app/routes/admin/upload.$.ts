import { type ActionArgs } from "@remix-run/cloudflare";
import { storage } from "superflare";
import invariant from "tiny-invariant";

export async function action({ request, params }: ActionArgs) {
  const filename = params["*"];

  invariant(filename, "No filename provided");

  // TODO: Make filename more unique with hash or something
  const uniqueFilename = `${Date.now()}-${filename}`;

  const object = await storage().put(uniqueFilename, request.body);

  console.log({ object });

  // TODO: Get URL from storage
  return `/storage/default/${uniqueFilename}`;
}
