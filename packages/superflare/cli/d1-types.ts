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
export const SUPERFLARE_TYPES_END_MARKER = "/* superflare-types-end */";

export function addTypesToModelClass(
  source: string,
  modelClass: string,
  types: SuperflareType[]
): string {
  const modelInterfaceStart = source.indexOf(SUPERFLARE_TYPES_START_MARKER);
  const modelInterfaceEnd = source.indexOf(SUPERFLARE_TYPES_END_MARKER);
  const modelHasTypes = modelInterfaceStart !== -1 && modelInterfaceEnd !== -1;

  const modelInterface = typesAsInterface(modelClass, types);

  return modelHasTypes
    ? source.substring(0, modelInterfaceStart) +
        wrapWithTypeMarkers(modelInterface) +
        source.substring(modelInterfaceEnd + SUPERFLARE_TYPES_END_MARKER.length)
    : source + "\n\n" + wrapWithTypeMarkers(modelInterface);
}

function typesAsInterface(modelClass: string, types: SuperflareType[]) {
  const interfaceName = modelClass + "Row";
  const typesAsString = types.map(
    (type) => `  ${type.name}${type.nullable ? "?" : ""}: ${type.type};`
  );

  return `interface ${interfaceName} {
${typesAsString.join("\n")}
}

export interface ${modelClass} extends ${interfaceName} {}`;
}

export function wrapWithTypeMarkers(source: string): string {
  return `${SUPERFLARE_TYPES_START_MARKER}\n${source}\n${SUPERFLARE_TYPES_END_MARKER}`;
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
        const oldModelSource = `import { Model } from 'superflare';\n\nexport class ${type.model} extends Model {
  toJSON(): ${type.model}Row {
    return super.toJSON();
  }
}\n\Model.register(${type.model});`;
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
