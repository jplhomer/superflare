import { type LoaderArgs, redirect, json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { User } from "~/models/User";

export async function loader({ context: { auth } }: LoaderArgs) {
  if (!(await auth.check(User))) {
    return redirect("/login");
  }

  return json({
    user: (await auth.user(User)) as User,
  });
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>Dashboard</h1>
      <p>You're logged in as {user.email}</p>

      <form method="post" action="/logout">
        <button type="submit">Log out</button>
      </form>
    </>
  );
}
