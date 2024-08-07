import { Form, Link, useActionData } from "@remix-run/react";
import { json, redirect, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { Button } from "~/components/admin/Button";
import { FormField } from "~/components/Form";
import { User } from "~/models/User";
import { hash } from "superflare";

export async function action({
  request,
  context: { auth },
}: ActionFunctionArgs) {
  if (await auth.check(User)) {
    return redirect("/admin");
  }

  const formData = new URLSearchParams(await request.text());
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (await User.where("email", email).count()) {
    return json({ error: "Email already exists" }, { status: 400 });
  }

  const user = await User.create({
    email,
    name,
    password: await hash().make(password),
  });

  auth.login(user);

  return redirect("/admin");
}

export default function Register() {
  const actionData = useActionData();

  return (
    <Form method="post" className="grid grid-cols-6 gap-4">
      <div className="col-span-6">
        <h1 className="text-2xl font-bold">Register</h1>
      </div>
      <FormField name="name" label="Name" autoComplete="name" />
      <FormField name="email" label="Email" type="email" required />
      <FormField name="password" label="Password" type="password" required />
      {actionData?.error && (
        <div className="col-span-6 text-red-500">{actionData.error}</div>
      )}
      <div className="col-span-6">
        <Button type="submit">Register</Button>
      </div>
      <div className="col-span-6">
        <Link to="/auth/register">Register</Link>
      </div>
    </Form>
  );
}
