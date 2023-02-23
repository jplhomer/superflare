import { json, type LoaderArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { Page } from "~/components/admin/Page";
import { Article } from "~/models/Article";
import { ArticleForm } from "./components/article-form";

export { action } from "./components/article-form";

export async function loader({ params }: LoaderArgs) {
  const { slug } = params;

  invariant(typeof slug === "string", "Missing slug");

  const article = await Article.where("slug", slug).first();

  return json(article);
}

export default function NewArticle() {
  const { article } = useLoaderData<typeof loader>();

  return (
    <Page title="Edit Article">
      <ArticleForm article={article} />
    </Page>
  );
}
