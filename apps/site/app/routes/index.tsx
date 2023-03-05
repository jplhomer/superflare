import Markdoc from "@markdoc/markdoc";
import { json, LoaderArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import React from "react";
import { Layout } from "~/components/Layout";
import { getMarkdownForPath, parseMarkdoc } from "~/docs.server";

import { Fence } from "~/components/Fence";
import { renderMarkdoc } from "~/markdoc";

export async function loader({ params, context: { env } }: LoaderArgs) {
  const path = params["*"] ?? ("index" as string);

  const useGitHub = process.env.NODE_ENV === "production";
  const markdown = await getMarkdownForPath(path, env.GITHUB_TOKEN, useGitHub);

  if (!markdown) {
    throw new Response("Not found", { status: 404 });
  }

  const { content, title, tableOfContents } = parseMarkdoc(markdown);

  return json({ content, title, tableOfContents });
}

export default function DocsPage() {
  const { content, title, tableOfContents } = useLoaderData<typeof loader>();

  return (
    <Layout tableOfContents={tableOfContents} title={title}>
      {renderMarkdoc(content)}
    </Layout>
  );
}
