export function blankMigration(contents = "// return ...") {
  return `import { Schema } from 'superflare';

export default function () {
  ${contents}
}`;
}
