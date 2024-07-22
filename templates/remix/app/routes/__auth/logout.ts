import { type ActionFunctionArgs, redirect } from "@remix-run/server-runtime";

export async function action({ context: { auth } }: ActionFunctionArgs) {
  auth.logout();

  return redirect("/");
}
