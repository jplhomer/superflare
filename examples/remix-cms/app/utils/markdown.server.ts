import { marked } from "marked";
import hljs from "highlight.js";

export async function convertToHtml(input: string) {
  return marked(input, {
    breaks: true,
    gfm: true,
    headerIds: false,
    smartLists: true,
    smartypants: true,
    highlight: (code, lang) =>
      hljs.highlight(code, {
        language: lang,
      }).value,
  });
}
