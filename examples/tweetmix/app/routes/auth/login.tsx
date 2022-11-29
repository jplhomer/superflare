import { json } from "@remix-run/cloudflare";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { Link } from "react-router-dom";
import type { TweetmixDataFunctionArgs } from "types";
import { Button, FloatingLabelInput } from "~/components/Form";
import { ThiccTitle, ValidationError } from "~/components/Text";
import { createUserSession, login } from "~/lib/session.server";

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username?: string | undefined;
    password?: string | undefined;
  };
  fields?: {
    username: string;
    password: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export async function action({ request, context }: TweetmixDataFunctionArgs) {
  const formData = new URLSearchParams(await request.text());

  const username = formData.get("username");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo");

  if (typeof username !== "string" || typeof password !== "string") {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  const fields = { username, password };
  const fieldErrors = {
    username: !username?.length ? "Username is required" : undefined,
    password: !password?.length ? "Password is required" : undefined,
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
    });
  }

  const user = await login(context, { username, password });
  if (!user) {
    return badRequest({
      formError: "Invalid username or password",
      fields,
    });
  }

  return createUserSession(user.id, redirectTo ?? "/");
}

export default function Login() {
  const actionData = useActionData();
  const [searchParams] = useSearchParams();

  return (
    <Form method="post" className="max-w-lg space-y-8 p-4">
      <ThiccTitle>Sign in to Tweetmix</ThiccTitle>

      <input
        type="hidden"
        name="redirectTo"
        value={searchParams.get("redirectTo") ?? undefined}
      />

      <FloatingLabelInput
        name="username"
        type="text"
        label="Username"
        error={actionData?.fieldErrors?.username}
        required
      />
      <FloatingLabelInput
        name="password"
        type="password"
        label="Password"
        error={actionData?.fieldErrors?.password}
        required
      />

      {actionData?.formError && (
        <ValidationError>{actionData.formError}</ValidationError>
      )}

      <Button type="submit" block>
        Log in
      </Button>

      <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
        Don't have an account?{" "}
        <Link className="text-blue-500" to="/auth/signup">
          Sign up
        </Link>
      </p>
    </Form>
  );
}
