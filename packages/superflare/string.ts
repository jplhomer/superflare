import { plural, singular } from "pluralize";

export function tableNameToModel(tableName: string): string {
  return tableName
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .map((part) => singular(part))
    .join("");
}

export function modelToTableName(modelName: string): string {
  return modelName
    .split(/(?=[A-Z])/)
    .map((part) => part.toLowerCase())
    .map((part) => plural(part))
    .join("_");
}
