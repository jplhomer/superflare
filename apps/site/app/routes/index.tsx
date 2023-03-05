import Markdoc, { nodes as defaultNodes } from "@markdoc/markdoc";
import { json, LoaderArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import React from "react";
import { Layout } from "~/components/Layout";
import { collectHeadings, getMarkdownForPath } from "~/docs.server";
import yaml from "js-yaml";
import { Fence } from "~/components/Fence";

interface Frontmatter {
  title: string;
}

export async function loader({ params }: LoaderArgs) {
  const path = params["*"] ?? ("index" as string);

  const markdown = await getMarkdownForPath(path);

  if (!markdown) {
    throw new Response("Not found", { status: 404 });
  }

  const ast = Markdoc.parse(markdown);
  const content = Markdoc.transform(ast, {
    nodes: {
      document: {
        render: undefined,
      },
      th: {
        ...defaultNodes.th,
        attributes: {
          ...defaultNodes.th.attributes,
          scope: {
            type: String,
            default: "col",
          },
        },
      },
      fence: {
        render: "Fence",
        attributes: {
          language: {
            type: String,
          },
        },
      },
    },
  });

  const frontmatter = ast.attributes.frontmatter
    ? (yaml.load(ast.attributes.frontmatter) as Frontmatter)
    : ({} as Frontmatter);

  const title = frontmatter.title;

  let tableOfContents =
    content && typeof content !== "string"
      ? collectHeadings(Array.isArray(content) ? content : content.children)
      : [];

  return json({ content, title, tableOfContents });
}

export default function DocsPage() {
  const { content, title, tableOfContents } = useLoaderData<typeof loader>();

  return (
    <Layout tableOfContents={tableOfContents} title={title}>
      {Markdoc.renderers.react(content, React, {
        components: {
          Fence,
        },
      })}
    </Layout>
  );
}
