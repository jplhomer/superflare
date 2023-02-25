import { json, type LoaderArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { SecondaryButton } from "~/components/admin/Button";
import { Page } from "~/components/admin/Page";
import { Article } from "~/models/Article";
import { convertToHtml } from "~/utils/markdown.server";

export async function loader({ params }: LoaderArgs) {
  const { slug } = params;

  invariant(typeof slug === "string", "Missing slug");

  const article = await Article.where("slug", slug).first();

  if (!article) {
    return new Response("Not found", { status: 404 });
  }

  return json({ article, html: await convertToHtml(article.content ?? "") });
}

export default function NewArticle() {
  const { html } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Preview Article"
      action={
        <SecondaryButton to="../" relative="path">
          Edit
        </SecondaryButton>
      }
    >
      <div
        className="prose dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      ></div>
    </Page>
  );
}
