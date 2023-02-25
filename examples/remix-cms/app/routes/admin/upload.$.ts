import { json, type ActionArgs } from "@remix-run/cloudflare";
import { storage } from "superflare";

export async function action({ request }: ActionArgs) {
  /**
   * This is probably inefficient, but it's the only way to get the `File`
   * which includes useful information like the file name and type.
   *
   * Remix offers (unstable) upload handler APIs which allow you to stream the file body to
   * the destination _before_ it's fully loaded into memory, whiel exposing the file name and file type.
   * This would be more efficient, but the APIs aren't fully developed, and I couldn't figure
   * out how to convert them to a proper `File` object to pass to `storage().put()`. We can
   * revisit this later.
   */
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const object = await storage().put(file);

  return json({
    url: storage().url(object.key),
  });
}
