import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { handleWebSockets } from "superflare";
import { User } from "~/models/User";

export async function loader({
  request,
  context: { auth, session },
}: LoaderFunctionArgs) {
  return handleWebSockets(request, { auth, session, userModel: User });
}
