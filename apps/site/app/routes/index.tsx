import {
  json,
  type LoaderArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { Layout } from "~/components/Layout";
import { getManifest, getMarkdownForPath, parseMarkdoc } from "~/docs.server";
import { renderMarkdoc } from "~/markdoc";

export async function loader({ params, context: { env } }: LoaderArgs) {
  const path = params["*"] ?? ("index" as string);

  const useGitHub = process.env.NODE_ENV === "production";
  const markdown = await getMarkdownForPath(path, env.GITHUB_TOKEN, useGitHub);

  if (!markdown) {
    throw new Response("Not found", { status: 404 });
  }

  const manifest = await getManifest(env.GITHUB_TOKEN, useGitHub);

  if (!manifest) {
    throw new Response("Manifest could not be loaded", { status: 404 });
  }

  const { content, title, tableOfContents, description } =
    parseMarkdoc(markdown);

  return json({ content, title, tableOfContents, manifest, description });
}

export const meta: MetaFunction = ({ data }: { data: any }) => {
  return {
    title: data.title,
    description: data.description,
  };
};

export default function DocsPage() {
  const { content, title, tableOfContents, manifest } =
    useLoaderData<typeof loader>();

  return (
    <Layout tableOfContents={tableOfContents} title={title} manifest={manifest}>
      {renderMarkdoc(content)}
    </Layout>
  );
}
