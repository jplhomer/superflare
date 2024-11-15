/**
 * Write a simple webserver that serves the local MD files from ../../../packages/superflare/docs.
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(import.meta.url);

// Load the markdown file from the local docs folder.
const docsPath = resolve(__dirname, "../../../../packages/superflare/docs");

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost`);

  let pathname = url.pathname === "/" ? "/index.md" : url.pathname;

  const filePath = join(docsPath, pathname);

  try {
    const file = await readFile(filePath, "utf8");
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/markdown");
    res.end(file);
  } catch (err) {
    console.log(err);
    res.statusCode = 404;
    res.end("Not found");
  }
});

const port = process.env.DOCS_PORT || 3123;

server.listen(3123).on("listening", () => {
  console.log(
    `Local Docs Server running:
- ${docsPath}
- http://localhost:${port}`
  );
});

process.on("SIGINT", () => {
  server.close();
  process.exit();
});

process.on("SIGTERM", () => {
  server.close();
  process.exit();
});
