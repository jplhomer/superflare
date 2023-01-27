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
