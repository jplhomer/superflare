import { json, redirect, type ActionArgs } from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { Article } from "~/models/Article";
import invariant from "tiny-invariant";
import { FormField } from "~/components/Form";
import { Button, SecondaryButton } from "~/components/admin/Button";
import { TextareaMarkdown } from "textarea-markdown-editor/dist/TextareaMarkdown";

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

export async function action({ request, context: { session } }: ActionArgs) {
  const body = new URLSearchParams(await request.text());
  const title = body.get("title");
  const content = body.get("content");
  const status = body.get("status");
  const id = body.get("id");

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
      const slug = title!.toLowerCase().replace(/ /g, "-");
      const article = await Article.create({
        // TODO: Use current user
        user_id: 1,
        title,
        content,
        status: "draft",
        slug,
      });

      session.flash("flash", { success: "Article created!" });

      return redirect(`/admin/articles/${article.slug}`);
    } else {
      const article = await Article.find(parseInt(id as string));

      invariant(article, "Article not found");

      article.title = title as string;
      article.content = content as string;
      article.status = status as string;
      article.slug = body.get("slug") as string;

      await article.save();

      session.flash("flash", { success: "Article saved!" });

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

export function ArticleForm({ article }: { article?: Article }) {
  const actionData = useActionData<ActionData>();

  return (
    <Form method="post">
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
            className="font-mono w-full dark:bg-gray-700"
            cols={80}
            rows={20}
            as={TextareaMarkdown}
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

      <div className="pt-5">
        <div className="flex justify-end space-x-2">
          <SecondaryButton to="/admin/articles">Cancel</SecondaryButton>
          <Button type="submit">{article ? "Update" : "Create"}</Button>
        </div>
      </div>
    </Form>
  );
}
