import { plural, singular } from "pluralize";

export function tableNameToModel(tableName: string): string {
  return tableName
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .map((part) => singular(part))
    .join("");
}

/**
 * Lowercase, snake_case, pluralize the last word.
 */
export function modelToTableName(modelName: string): string {
  const parts = modelName.split(/(?=[A-Z])/);
  const last = parts.pop()!;
  return parts
    .map((part) => part.toLowerCase())
    .concat(plural(last.toLowerCase()))
    .join("_");
}

export function modelToForeignKeyId(modelName: string): string {
  return `${singular(modelToTableName(modelName))}Id`;
}

export function lowercaseFirstLetter(string: string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

/**
 * Sometimes, our bundle creates multiple references to the same imported module. This results
 * in some references with numbers appended to them. We want to remove those numbers to sanitize
 * the event names in order for client listeners to distinguish which events are being emitted.
 */
export function sanitizeModuleName(name: string) {
  return name.replace(/\d+$/, "");
}
