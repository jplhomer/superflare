export function modelTemplate(name: string) {
  return `import { Model } from "superflare";

export class ${name} extends Model {
  toJSON(): ${name}Row {
    return super.toJSON();
  }
}

Model.register(${name});

/* superflare-types-start */
interface ${name}Row {
}
export interface ${name} extends ${name}Row {}
/* superflare-types-end */
`;
}
