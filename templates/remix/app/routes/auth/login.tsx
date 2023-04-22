import { Form, Link, useActionData } from "@remix-run/react";
import { json, redirect, type ActionArgs } from "@remix-run/cloudflare";
import { User } from "~/models/User";
import { auth } from "superflare";

export async function action({ request }: ActionArgs) {
  if (await auth().check(User)) {
    return redirect("/dashboard");
  }

  const formData = new URLSearchParams(await request.text());
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (await auth().attempt(User, { email, password })) {
    return redirect("/dashboard");
  }

  return json({ error: "Invalid credentials" }, { status: 400 });
}

export async function loader() {
  if (await auth().check(User)) {
    return redirect("/dashboard");
  }

  return null;
}

export default function Login() {
  const actionData = useActionData();

  return (
    <Form method="post">
      <h1>Log in</h1>

      <div>
        <label htmlFor="email">Email</label>
        <input name="email" type="email" required />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input name="password" type="password" required />
      </div>

      {actionData?.error && (
        <div style={{ color: "red" }}>{actionData.error}</div>
      )}

      <button type="submit">Log in</button>

      <Link to="/auth/register">Register</Link>
    </Form>
  );
}
