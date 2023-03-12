import { writeFile } from "node:fs/promises";
import path from "node:path";
import { modelToTableName } from "../../src/string";
import { getSuperflareConfig } from "../config";
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

  logger.log(`Generating Model ${name}`);

  const output = modelTemplate(name);

  const modelPath = path.join(argv.path, `${name}.ts`);
  await writeFile(modelPath, output);

  logger.log(`Generated Job ${name} at ${modelPath}`);

  if (argv.migration) {
    const tableName = modelToTableName(name);
    const migrationName = `create_${tableName}`;

    generateMigration(migrationName);
  }
}
