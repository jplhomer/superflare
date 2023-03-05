import type { RenderableTreeNode } from "@markdoc/markdoc";
import { slugifyWithCounter } from "@sindresorhus/slugify";
import { TableOfContents } from "./components/Layout";
import yaml from "js-yaml";
import Markdoc, { nodes as defaultNodes } from "@markdoc/markdoc";

const DOCS_PORT = 3123;

export async function getDocsForPathFromLocal(path: string) {
  try {
    const res = await fetch(`http://localhost:${DOCS_PORT}/${path}`);
    return await res.text();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getDocsForPathFromGitHub(
  path: string,
  gitHubToken: string
) {
  const repo = "jplhomer/superflare";
  const docsPath = "packages/superflare/docs";

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${docsPath}/${path}`,
      {
        headers: {
          "User-Agent": "Superflare Docs Site",
          Accept: "application/vnd.github.raw",
          "X-GitHub-Api-Version": "2022-11-28",
          Authorization: `Bearer ${gitHubToken}`,
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch ${path} from GitHub: ${res.statusText}`);
    }

    return await res.text();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getMarkdownForPath(
  path: string,
  gitHubToken: string,
  useGitHub: boolean
) {
  const pathname = path === "/" ? "/index" : path;

  const markdown = useGitHub
    ? await getDocsForPathFromGitHub(pathname + ".md", gitHubToken)
    : await getDocsForPathFromLocal(pathname + ".md");
  return markdown;
}

export interface ManifestLink {
  title: string;
  href: string;
}

export interface ManifestEntry {
  title: string;
  links: ManifestLink[];
}

export type Manifest = ManifestEntry[];

export async function getManifest(
  gitHubToken: string,
  useGitHub: boolean
): Promise<Manifest> {
  const manifest = useGitHub
    ? await getDocsForPathFromGitHub("manifest.json", gitHubToken)
    : await getDocsForPathFromLocal("manifest.json");

  if (!manifest) return null;
  return JSON.parse(manifest);
}

function getNodeText(node: RenderableTreeNode) {
  let text = "";
  if (typeof node === "string" || !node) return text;
  for (let child of node.children ?? []) {
    if (typeof child === "string") {
      text += child;
    }
    text += getNodeText(child);
  }
  return text;
}

export function collectHeadings(
  nodes: RenderableTreeNode[],
  slugify = slugifyWithCounter()
): TableOfContents {
  let sections = [];

  for (let node of nodes) {
    if (!node || typeof node !== "object") continue;
    if (node.name === "h2" || node.name === "h3") {
      let title = getNodeText(node);
      if (title) {
        let id = slugify(title);
        node.attributes.id = id;
        if (node.name === "h3") {
          if (!sections[sections.length - 1]) {
            throw new Error(
              "Cannot add `h3` to table of contents without a preceding `h2`"
            );
          }
          sections[sections.length - 1].children.push({
            ...node.attributes,
            title,
          });
        } else {
          sections.push({ ...node.attributes, title, children: [] });
        }
      }
    }

    sections.push(...collectHeadings(node.children ?? [], slugify));
  }

  return sections;
}

export interface Frontmatter {
  title: string;
}

export function parseMarkdoc(markdown: string) {
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

  return { content, frontmatter, tableOfContents, title };
}
