import { redirect } from "@remix-run/server-runtime";
import { auth } from "superflare";

export async function action() {
  auth().logout();

  return redirect("/");
}
