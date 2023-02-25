import { Button } from "~/components/admin/Button";
import { Page } from "~/components/admin/Page";
import { ArticleForm } from "./components/article-form";

export { action } from "./components/article-form";

export default function NewArticle() {
  return (
    <Page
      title="New Article"
      action={
        <Button form="article-form" type="submit">
          Create
        </Button>
      }
    >
      <ArticleForm id="article-form" />
    </Page>
  );
}
