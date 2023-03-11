export function modelTemplate(name: string) {
  return `import { Model } from "superflare";

export class ${name} extends Model {
  toJSON(): ${name}Row {
    return super.toJSON();
  }
}

Model.register(${name});

export interface ${name} extends ${name}Row {}
`;
}
