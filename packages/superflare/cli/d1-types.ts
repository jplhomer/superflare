import type Database from "better-sqlite3";
import pluralize from "pluralize";
import fs from "fs";

export interface SuperflareType {
  name: string;
  // Mimics the types available in SQLite
  type: "string" | "number" | "boolean" | "date";
  nullable: boolean;
}

export const SUPERFLARE_TYPES_START_MARKER = "/* superflare-types-start */";
const ESCAPED_SUPERFLARE_TYPES_START_MARKER =
  SUPERFLARE_TYPES_START_MARKER.replace(/\*/g, "\\*");

export const SUPERFLARE_TYPES_END_MARKER = "/* superflare-types-end */";
const ESCAPED_SUPERFLARE_TYPES_END_MARKER = SUPERFLARE_TYPES_END_MARKER.replace(
  /\*/g,
  "\\*"
);

export function addTypesToModelClass(
  source: string,
  modelClass: string,
  types: SuperflareType[]
): string {
  const modelHasTypes = source.includes(SUPERFLARE_TYPES_START_MARKER);
  const modelClassRegex = modelHasTypes
    ? new RegExp(
        `${ESCAPED_SUPERFLARE_TYPES_START_MARKER}.*${ESCAPED_SUPERFLARE_TYPES_END_MARKER}`,
        "s"
      )
    : new RegExp(`export class ${modelClass} extends Model {`);

  const typesAsString = types.map(
    (type) => `  ${type.name}${type.nullable ? "?" : "!"}: ${type.type};`
  );

  const replacement = modelHasTypes
    ? wrapWithTypeMarkers(typesAsString.join("\n"))
    : `export class ${modelClass} extends Model {
  ${wrapWithTypeMarkers(typesAsString.join("\n"))}`;

  return source.replace(modelClassRegex, replacement);
}

function wrapWithTypeMarkers(source: string): string {
  return `${SUPERFLARE_TYPES_START_MARKER}\n${source}\n  ${SUPERFLARE_TYPES_END_MARKER}`;
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
  table.startsWith("sqlite_") || table === "d1_migrations";

/**
 * Takes a JSON schema and generates a list of Superflare types for each table.
 */
export function generateTypesFromSqlite(db: Database.Database) {
  const tableList = db
    .prepare("PRAGMA table_list")
    .all()
    .filter(
      (table) => !ignoreSqliteTable(table.name)
    ) as SqliteTableListTable[];

  const types: ModelWithSuperflareTypes[] = [];

  for (const table of tableList) {
    const tableInfo = db
      .prepare(`PRAGMA table_info(${table.name})`)
      .all() as SqliteTableInfoColumn[];
    const tableTypes: SuperflareType[] = [];

    for (const column of tableInfo) {
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

export function addTypesToModelsInDirectory(
  pathToModels: string,
  types: ModelWithSuperflareTypes[],
  options: {
    createIfNotFound?: boolean;
  } = {}
) {
  return types.map((type) => {
    try {
      const modelSource = fs.readFileSync(
        `${pathToModels}/${type.model}.ts`,
        "utf-8"
      );
      const newModelSource = addTypesToModelClass(
        modelSource,
        type.model,
        type.types
      );
      fs.writeSync(
        fs.openSync(`${pathToModels}/${type.model}.ts`, "w"),
        newModelSource
      );

      return {
        model: type.model,
        status: modelSource !== newModelSource ? "updated" : "unchanged",
      };
    } catch (e) {
      if (options?.createIfNotFound) {
        const oldModelSource = `import { Model } from 'superflare';\n\nexport class ${type.model} extends Model {\n}`;
        const newModelSource = addTypesToModelClass(
          oldModelSource,
          type.model,
          type.types
        );

        fs.writeSync(
          fs.openSync(`${pathToModels}/${type.model}.ts`, "w"),
          newModelSource
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
}

function readJsOrTsFile(pathWithoutExtension: string) {
  try {
    return fs.readFileSync(`${pathWithoutExtension}.ts`, "utf-8");
  } catch (_e) {
    return fs.readFileSync(`${pathWithoutExtension}.js`, "utf-8");
  }
}
