import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { expect, it } from "vitest";
import { generateMigration } from "../../cli/generate/migration";
import { withFileSystem } from "../utils";

it("starts with 0 if first migration", async () => {
  await withFileSystem({}, async (rootPath) => {
    await generateMigration("add things", rootPath);

    expect(await readdir(join(rootPath, "app", "migrations"))).toEqual([
      "0000_add_things.ts",
    ]);

    expect(
      await readFile(
        join(rootPath, "app", "migrations", "0000_add_things.ts"),
        "utf-8"
      )
    ).toEqual(`import { Schema } from 'superflare';

export default function () {
  // return ...
}`);
  });
});

it("increments number for other migrations", async () => {
  await withFileSystem(
    {
      "migrations/0000_add_things.sql": "",
    },
    async (rootPath) => {
      await generateMigration("add more things", rootPath);

      expect(await readdir(join(rootPath, "app", "migrations"))).toEqual([
        "0001_add_more_things.ts",
      ]);
    }
  );
});
