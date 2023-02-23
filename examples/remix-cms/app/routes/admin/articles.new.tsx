import { Page } from "~/components/admin/Page";
import { ArticleForm } from "./components/article-form";

export { action } from "./components/article-form";

export default function NewArticle() {
  return (
    <Page title="New Article">
      <ArticleForm />
    </Page>
  );
}
