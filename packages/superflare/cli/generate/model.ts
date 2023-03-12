import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { modelToTableName } from "../../src/string";
import { SUPERFLARE_TYPES_FILE } from "../d1-types";
import { logger } from "../logger";
import { modelTemplate } from "../stubs/model.stub";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "../yargs-types";
import { generateMigration } from "./migration";

export function modelOptions(yargs: CommonYargsArgv) {
  return yargs
    .option("name", {
      type: "string",
      description: "Name of the model",
      required: true,
    })
    .option("path", {
      type: "string",
      description: "The path to generate the Model in",
      default: path.join(process.cwd(), "app", "models"),
    })
    .option("migration", {
      alias: "m",
      type: "boolean",
      description: "Generate a migration for the model",
      default: false,
    });
}

export async function modelHandler(
  argv: StrictYargsOptionsToInterface<typeof modelOptions>
) {
  const { name } = argv;

  logger.log(`Generating model ${name}`);

  const output = modelTemplate(name);

  const modelPath = path.join(argv.path, `${name}.ts`);
  await mkdir(path.dirname(modelPath), { recursive: true });
  await writeFile(modelPath, output);

  // Update the superflare types to ensure the {Model}Row exists, even if it's empty.
  const typeFilePath = path.join(process.cwd(), SUPERFLARE_TYPES_FILE);

  try {
    let contents = await readFile(typeFilePath, "utf-8");
    contents += `\n\interface ${name}Row {};`;

    await writeFile(typeFilePath, contents);
  } catch (_e) {
    const contents = `interface ${name}Row {};`;

    await writeFile(typeFilePath, contents);
  }

  logger.log(`Generated model ${name} at ${modelPath}`);

  if (argv.migration) {
    const tableName = modelToTableName(name);
    const migrationName = `create_${tableName}`;

    generateMigration(migrationName);
  }
}
