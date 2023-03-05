import { Node, RenderableTreeNode } from "@markdoc/markdoc";
import { slugifyWithCounter } from "@sindresorhus/slugify";

const DOCS_PORT = 3123;

export async function getMarkdownForPathFromLocal(path: string) {
  try {
    const res = await fetch(`http://localhost:${DOCS_PORT}/${path}`);
    return await res.text();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getMarkdownForPath(path: string) {
  // TODO: Switch on whether we're in production
  const markdown = await getMarkdownForPathFromLocal(path);
  return markdown;
}

function getNodeText(node) {
  let text = "";
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
) {
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
