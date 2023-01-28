import Database from "better-sqlite3";
import pluralize from "pluralize";

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
    (type) => `  ${type.name}${type.nullable ? "?" : ""}: ${type.type};`
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

/**
 * Takes a JSON schema and generates a list of Superflare types for each table.
 */
export function generateTypesFromSqlite(db: Database.Database) {
  const tableList = db
    .prepare("PRAGMA table_list")
    .all()
    .filter(
      (table) => !table.name.startsWith("sqlite_")
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
