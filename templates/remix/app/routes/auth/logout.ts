import { type ActionArgs, redirect } from "@remix-run/server-runtime";

export async function action({ context: { auth } }: ActionArgs) {
  auth.logout();

  return redirect("/");
}
