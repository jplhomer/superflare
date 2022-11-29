import { type LoaderArgs, redirect } from "@remix-run/cloudflare";
import { getUserId } from "~/lib/session.server";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);

  return redirect(userId ? "/home" : "/explore");
}

export default function Index() {
  return "Redirecting...";
}
