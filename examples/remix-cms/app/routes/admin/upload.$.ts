import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { parseMultipartFormData, storage } from "superflare";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await parseMultipartFormData(
    request,
    async ({ stream, filename }) => {
      const object = await storage().putRandom(stream, {
        extension: filename?.split(".").pop(),
      });

      return object.key;
    }
  );

  return json({
    url: storage().url(formData.get("file") as string),
  });
}
