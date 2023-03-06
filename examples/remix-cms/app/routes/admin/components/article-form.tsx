import {
  json,
  redirect,
  type SerializeFrom,
  type ActionArgs,
} from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { Article } from "~/models/Article";
import invariant from "tiny-invariant";
import { FormField } from "~/components/Form";
import MarkdownComposer from "~/components/admin/MarkdownComposer";
import { auth, session } from "superflare";
import { User } from "~/models/User";

interface ActionData {
  title: string | null;
  content: string | null;
  status: string | null;
  error?: string;
  errors?: {
    title?: string;
    content?: string;
    status?: string;
  };
}

const enum Intent {
  Create = "create",
  Update = "update",
}

const badResponse = (data: ActionData) => json(data, { status: 422 });

export async function action({ request }: ActionArgs) {
  const body = new URLSearchParams(await request.text());
  const title = body.get("title");
  const content = body.get("content");
  const status = body.get("status");
  const id = body.get("id");
  const user = await auth().user(User);

  const intent = id ? Intent.Update : Intent.Create;

  let errors: ActionData["errors"] = {};

  if (!title) {
    errors["title"] = "Missing title";
  }

  if (Object.values(errors).length) {
    return badResponse({
      title,
      content,
      status,
      errors,
      error: "There were errors with your submission",
    });
  }

  try {
    if (intent === Intent.Create) {
      const slug = title!
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const article = await Article.create({
        userId: user!.id,
        title,
        content,
        status: "draft",
        slug,
      });

      session().flash("flash", { success: "Article created!" });

      return redirect(`/admin/articles/${article.slug}`);
    } else {
      const article = await Article.find(parseInt(id as string));

      invariant(article, "Article not found");

      article.title = title as string;
      article.content = content as string;
      article.status = status as string;
      article.slug = body.get("slug") as string;

      await article.save();

      session().flash("flash", { success: "Article saved!" });

      return redirect(`/admin/articles/${article.slug}`);
    }
  } catch (error: any) {
    return badResponse({
      title,
      content,
      status,
      error: `Error saving article: ${error.message}`,
    });
  }
}

export function ArticleForm({
  article,
  id,
}: {
  article?: SerializeFrom<Article>;
  id?: string;
}) {
  const actionData = useActionData<ActionData>();

  const ContentMarkdown = (props: any) => {
    return (
      <MarkdownComposer
        onInsertImage={async (file) => {
          /**
           * Sending the image as FormData has some advantages:
           * - Filename is included automatically
           * - Mime type is included automatically
           * - No need to manually set the Content-Type header
           */
          const formData = new FormData();
          formData.append("file", file, file.name);
          const response = await fetch(`/admin/upload`, {
            method: "POST",
            body: formData,
          });

          const { url } = await response.json<{ url: string }>();

          return url;
        }}
        id="content"
        name="content"
        placeholder="Write your article (in markdown)"
        {...props}
      />
    );
  };

  return (
    <Form method="post" id={id}>
      {article && <input type="hidden" name="id" value={article.id} />}

      <div className="space-y-8 divide-y divide-gray-200">
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <FormField
            name="title"
            label="Title"
            defaultValue={article?.title}
            type="text"
            required
          />

          <FormField
            name="content"
            label="Content"
            defaultValue={article?.content}
            className="font-mono block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700"
            cols={80}
            rows={20}
            as={ContentMarkdown}
          />

          {article && (
            <FormField
              name="slug"
              label="Slug"
              defaultValue={article.slug}
              type="text"
              required
            />
          )}

          {article && (
            <FormField
              name="status"
              label="Status"
              defaultValue={article.status}
              as="select"
              required
              options={[
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
              ]}
            />
          )}
        </div>
      </div>

      {actionData?.error && (
        <div className="bg-red-50 dark:bg-red-700 border-l-4 border-red-400 p-4 mb-4 mt-5">
          {actionData.error}
        </div>
      )}
    </Form>
  );
}
