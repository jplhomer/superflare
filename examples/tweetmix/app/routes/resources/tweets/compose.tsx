import { json, redirect } from "@remix-run/cloudflare";
import {
  Form,
  useActionData,
  useLocation,
  useTransition,
} from "@remix-run/react";
import type { KeyboardEvent } from "react";
import { createRef, useEffect } from "react";
import type { TweetmixDataFunctionArgs } from "types";
import { Button } from "~/components/Form";
import { ValidationError } from "~/components/Text";
import { requireUserId } from "~/lib/session.server";
import { Tweet } from "~/models/tweet.server";
import type { UserData } from "~/models/user.server";

type ActionData = {
  formError?: string;
  fields?: {
    text: string;
  };
  fieldErrors?: {
    text?: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export async function action({ request, context }: TweetmixDataFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = new URLSearchParams(await request.text());

  const text = formData.get("text");
  const redirectTo = formData.get("redirectTo");

  if (typeof text !== "string" || typeof redirectTo !== "string") {
    return badRequest({
      formError: "Invalid form data",
    });
  }

  const fields = { text };
  const fieldErrors = {
    // TODO: Validate length
    text: text ? undefined : "Tweet text is required",
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fields,
      fieldErrors,
    });
  }

  await Tweet.create({ text, userId }, context);

  return redirect(redirectTo);
}

export function TweetComposer({ user }: { user: UserData }) {
  const actionData = useActionData<ActionData>();
  const location = useLocation();
  const transition = useTransition();
  const isAdding =
    transition.state === "submitting" &&
    transition.submission.formData.get("_action") === "composeTweet";
  const formRef = createRef<HTMLFormElement>();

  const submitOnCmdEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.metaKey) {
      formRef.current?.submit();
    }
  };

  useEffect(() => {
    if (!isAdding) {
      formRef?.current?.reset();
    }
  }, [formRef, isAdding]);

  return (
    <Form
      replace
      method="post"
      action="/resources/tweets/compose"
      className="flex space-x-4 p-4"
      ref={formRef}
    >
      <div className="shrink">
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-12 h-12 rounded-full"
        />
      </div>
      <div className="grow">
        <input type="hidden" name="redirectTo" value={location.pathname} />
        <input type="hidden" name="_action" value="composeTweet" />
        <textarea
          className="block w-full border-b border-gray-300 dark:border-gray-600 p-2 text-lg mb-2 dark:bg-black focus:outline-none"
          name="text"
          placeholder="What's happening?"
          defaultValue={actionData?.fields?.text}
          onKeyDown={submitOnCmdEnter}
        />
        {actionData?.fieldErrors?.text && (
          <ValidationError>{actionData.fieldErrors.text}</ValidationError>
        )}
        {actionData?.formError && (
          <ValidationError>{actionData.formError}</ValidationError>
        )}
        <div className="flex justify-end">
          <Button type="submit">Tweet</Button>
        </div>
      </div>
    </Form>
  );
}
