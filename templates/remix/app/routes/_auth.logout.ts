import { type ActionFunctionArgs, redirect } from "@remix-run/cloudflare";

export async function action({ context: { auth } }: ActionFunctionArgs) {
  auth.logout();

  return redirect("/");
}
