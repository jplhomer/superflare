import type { D1Database } from "@cloudflare/workers-types";
import pluralize from "pluralize";
import fs from "fs";
import path from "path";

export interface SuperflareType {
  name: string;
  // Mimics the types available in SQLite
  type: "string" | "number" | "boolean" | "date";
  nullable: boolean;
}

export const SUPERFLARE_TYPES_FILE = "superflare.env.d.ts";

export function modelTypesAsInterface(
  modelClass: string,
  types: SuperflareType[]
) {
  const interfaceName = modelClass + "Row";
  const typesAsString = types.map(
    (type) => `  ${type.name}${type.nullable ? "?" : ""}: ${type.type};`
  );

  return `interface ${interfaceName} {
${typesAsString.join("\n")}
}`;
}

interface SqliteTableListTable {
  schema: string;
  name: string;
  type: string;
  ncol: number;
  wr: number;
  strict: number;
}

interface SqliteTableInfoColumn {
  cid: number;
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: any;
  pk: boolean;
}

interface ModelWithSuperflareTypes {
  model: string;
  types: SuperflareType[];
}

const ignoreSqliteTable = (table: string) =>
  table === "d1_migrations" ||
  table === "_cf_KV" ||
  table.startsWith("sqlite_");

/**
 * Takes a JSON schema and generates a list of Superflare types for each table.
 */
export async function generateTypesFromSqlite(db: D1Database) {
  const tableList = (
    await db.prepare("PRAGMA table_list").all<SqliteTableListTable>()
  ).results!.filter((table) => !ignoreSqliteTable(table.name));

  const types: ModelWithSuperflareTypes[] = [];

  for (const table of tableList) {
    const { results } = await db
      .prepare(`PRAGMA table_info(${table.name})`)
      .all<SqliteTableInfoColumn>();
    const tableTypes: SuperflareType[] = [];

    for (const column of results!) {
      const type = sqliteColumnTypeToSuperflareType(column.type.toLowerCase());

      tableTypes.push({
        name: column.name,
        type,
        nullable: column.pk ? false : !column.notnull,
      });
    }

    types.push({ model: tableNameToModel(table.name), types: tableTypes });
  }

  return types;
}

function sqliteColumnTypeToSuperflareType(
  type: string
): SuperflareType["type"] {
  switch (type) {
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "text":
    default:
      return "string";
  }
}

function tableNameToModel(tableName: string): string {
  return tableName
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .map((part) => pluralize.singular(part))
    .join("");
}

/**
 * Syncs the Superflare types in the given models directory with a local `superflare.env.d.ts` file.
 * If `createIfNotFound` is true, it will create the model file if it doesn't exist.
 */
export function syncSuperflareTypes(
  pathToRoot: string,
  pathToModels: string,
  types: ModelWithSuperflareTypes[],
  options: {
    createIfNotFound?: boolean;
  } = {}
) {
  let typesFileSources: string[] = [];

  const results = types.map((type) => {
    try {
      typesFileSources.push(modelTypesAsInterface(type.model, type.types));

      // Try to read the model file, which will kick to the catch if it doesn't exist
      fs.readFileSync(`${pathToModels}/${type.model}.ts`, "utf-8");

      return {
        model: type.model,
        status: "synced",
      };
    } catch (e) {
      if (options?.createIfNotFound) {
        const modelSource = `import { Model } from 'superflare';\n\nexport class ${type.model} extends Model {
  toJSON(): ${type.model}Row {
    return super.toJSON();
  }
}\n\Model.register(${type.model});\n\nexport interface ${type.model} extends ${type.model}Row {};`;

        fs.writeSync(
          fs.openSync(`${pathToModels}/${type.model}.ts`, "w"),
          modelSource
        );

        return {
          model: type.model,
          status: "created",
        };
      }

      return {
        model: type.model,
        status: "not-found",
      };
    }
  });

  const typesBanner = `// This file is automatically generated by Superflare. Do not edit directly.\n\n`;

  // Write the types file
  const typesFileSource = typesBanner + typesFileSources.join("\n\n");
  fs.writeFileSync(
    path.join(pathToRoot, SUPERFLARE_TYPES_FILE),
    typesFileSource
  );

  return results;
}
