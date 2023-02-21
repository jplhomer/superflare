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
