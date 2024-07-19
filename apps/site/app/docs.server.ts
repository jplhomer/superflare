import type { RenderableTreeNode, Schema, Tag } from "@markdoc/markdoc";
import Markdoc, { nodes as defaultNodes } from "@markdoc/markdoc";
import { slugifyWithCounter } from "@sindresorhus/slugify";
import yaml from "js-yaml";
import { type TableOfContents } from "./components/Layout";

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
        cf: {
          cacheEverything: true,
          // One Hour
          cacheTtl: 60 * 60,
        },
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
): Promise<Manifest | null> {
  const manifest = useGitHub
    ? await getDocsForPathFromGitHub("manifest.json", gitHubToken)
    : await getDocsForPathFromLocal("manifest.json");

  if (!manifest) return null;
  return JSON.parse(manifest);
}

function getNodeText(renderableNode: RenderableTreeNode) {
  if (typeof renderableNode === "string") return renderableNode;
  if (!renderableNode || typeof renderableNode !== "object") return "";
  let text = "";
  let node = renderableNode as Tag;
  for (let child of node.children ?? []) {
    if (typeof child === "string") {
      text += child;
    } else {
      text += getNodeText(child);
    }
  }
  return text;
}

export function collectHeadings(
  nodes: RenderableTreeNode[],
  slugify = slugifyWithCounter()
): TableOfContents {
  let sections: TableOfContents = [];

  for (let renderableNode of nodes) {
    if (!renderableNode || typeof renderableNode !== "object") {
      continue;
    }

    let node = renderableNode as Tag;

    if (node.name === "h2" || node.name === "h3") {
      let title = getNodeText(node);
      if (title) {
        let id = slugify(title);
        let attributes = { children: [], ...node.attributes, id, title };
        if (node.name === "h3") {
          let previousSection = sections[sections.length - 1];
          if (!previousSection) {
            throw new Error(
              "Cannot add `h3` to table of contents without a preceding `h2`"
            );
          }
          (previousSection.children as TableOfContents).push(attributes);
        } else {
          attributes.children = [];
          sections.push(attributes);
        }
      }
    }

    sections.push(...collectHeadings(node.children ?? [], slugify));
  }

  return sections;
}

export interface Frontmatter {
  description?: string;
  title: string;
}

const tags: Record<string, Schema> = {
  callout: {
    attributes: {
      title: { type: String },
      type: {
        type: String,
        default: "note",
        matches: ["note", "warning"],
        errorLevel: "critical",
      },
    },
    render: "Callout",
  },
  "quick-links": {
    render: "QuickLinks",
  },
  "quick-link": {
    selfClosing: true,
    render: "QuickLink",
    attributes: {
      title: { type: String },
      description: { type: String },
      icon: { type: String },
      href: { type: String },
    },
  },
};

export function parseMarkdoc(markdown: string) {
  const ast = Markdoc.parse(markdown);
  const content = Markdoc.transform(ast, {
    tags,
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
  const description = frontmatter.description;

  let tableOfContents =
    content && typeof content !== "string"
      ? collectHeadings(
          Array.isArray(content) ? content : (content as Tag).children
        )
      : [];

  return { content, frontmatter, tableOfContents, title, description };
}
