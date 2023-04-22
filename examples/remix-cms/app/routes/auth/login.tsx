import { Form, Link, useActionData } from "@remix-run/react";
import { json, redirect, type ActionArgs } from "@remix-run/cloudflare";
import { Button } from "~/components/admin/Button";
import { FormField } from "~/components/Form";
import { User } from "~/models/User";
import { auth } from "superflare";

export async function action({ request }: ActionArgs) {
  if (await auth().check(User)) {
    return redirect("/admin");
  }

  const formData = new URLSearchParams(await request.text());

  if (formData.get("bypass") === "user") {
    auth().login((await User.first()) as User);
    return redirect("/admin");
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (await auth().attempt(User, { email, password })) {
    return redirect("/admin");
  }

  return json({ error: "Invalid credentials" }, { status: 400 });
}

export async function loader() {
  if (await auth().check(User)) {
    return redirect("/admin");
  }

  return null;
}

export default function Login() {
  const actionData = useActionData();

  return (
    <>
      <Form method="post" className="grid grid-cols-6 gap-4">
        <div className="col-span-6">
          <h1 className="text-2xl font-bold">Log in</h1>
        </div>
        <FormField name="email" label="Email" type="email" required />
        <FormField name="password" label="Password" type="password" required />
        {actionData?.error && (
          <div className="col-span-6 text-red-500">{actionData.error}</div>
        )}
        <div className="col-span-6">
          <Button type="submit">Log in</Button>
        </div>
        <div className="col-span-6">
          <Link to="/auth/register">Register</Link>
        </div>
        <div className="col-span-6"></div>
      </Form>
      <Form method="post">
        <button name="bypass" value="user" type="submit">
          Log in as demo
        </button>
      </Form>
    </>
  );
}
