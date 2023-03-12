import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export async function withFileSystem(
  files: Record<string, string>,
  fn: (rootPath: string) => Promise<void>
) {
  const rootPath = await mkdtemp(join(tmpdir(), "superflare-test"));

  // Copy fake Superflare node_module to the root path
  await cp(
    join(__dirname, "..", "dist"),
    join(rootPath, "node_modules", "superflare"),
    {
      recursive: true,
    }
  );

  // Create a package.json file in the root path
  await writeFile(
    join(rootPath, "package.json"),
    JSON.stringify({
      name: "superflare-test",
      dependencies: {
        superflare: "file:node_modules/superflare",
      },
    })
  );

  const promises = Object.entries(files).map(async ([path, content]) => {
    const fullPath = join(rootPath, ...path.split("/"));
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
  });

  const cleanup = () => rm(rootPath, { recursive: true, force: true });

  await Promise.all(promises)
    .then(() => fn(rootPath))
    .catch((e) => {
      throw e;
    })
    .finally(cleanup);
}
