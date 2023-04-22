import { auth } from "superflare";
import { redirect } from "@remix-run/cloudflare";

export async function action() {
  auth().logout();

  return redirect("/");
}
