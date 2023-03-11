type SchemaMode = "create" | "update" | "delete";

export class Schema {
  constructor(
    protected tableName: String,
    protected builder: SchemaBuilder,
    protected mode: SchemaMode = "create"
  ) {}

  addCommand(command: string) {
    this.builder.commands.push(command);
  }

  static create(tableName: string, callback: (builder: SchemaBuilder) => void) {
    const builder = new SchemaBuilder(tableName);
    callback(builder);

    return new Schema(tableName, builder);
  }

  static update(tableName: string, callback: (builder: SchemaBuilder) => void) {
    const builder = new SchemaBuilder(tableName);
    callback(builder);

    return new Schema(tableName, builder, "update");
  }

  static rename(oldTableName: string, newTableName: string) {
    const schema = new Schema(
      oldTableName,
      new SchemaBuilder(newTableName),
      "update"
    );
    schema.addCommand(`RENAME TO ${newTableName}`);
    return schema;
  }

  static drop(tableName: string) {
    const schema = new Schema(
      tableName,
      new SchemaBuilder(tableName),
      "delete"
    );
    return schema;
  }

  toSql() {
    if (this.mode === "create") {
      return `CREATE TABLE ${this.tableName} (
${this.builder.columns.map((c) => "  " + c).join(",\n")}
);`;
    } else if (this.mode === "update") {
      const lines = [
        ...this.builder.commands,
        ...this.builder.columns.map((c) => "ADD COLUMN " + c),
      ];

      return `ALTER TABLE ${this.tableName}
${lines.join(",\n")};`;
    } else if (this.mode === "delete") {
      return `DROP TABLE ${this.tableName};`;
    }

    throw new Error(`Unknown schema mode: ${this.mode}`);
  }
}

export class SchemaBuilder {
  public columns: ColumnDefinition[] = [];
  public commands: string[] = [];

  constructor(protected tableName: String) {}

  blob(columnName: string) {
    return this.addColumn(columnName, "BLOB");
  }

  boolean(columnName: string) {
    // sqlite doesn't have a BOOLEAN type, but it's smart enough to cast.
    return this.addColumn(columnName, "BOOLEAN");
  }

  date(columnName: string) {
    // sqlite doesn't have a DATE type, but it's smart enough to cast.
    return this.addColumn(columnName, "DATE");
  }

  dateTime(columnName: string) {
    // sqlite doesn't have a DATETIME type, but it's smart enough to cast.
    return this.addColumn(columnName, "DATETIME");
  }

  increments(columnName: string) {
    return this.integer(columnName, true);
  }

  float(columnName: string) {
    // sqlite doesn't have a FLOAAT type, but it's smart enough to cast.
    return this.addColumn(columnName, "FLOAT");
  }

  integer(columnName: string, primaryKey?: boolean) {
    return this.addColumn(columnName, "INTEGER", {
      primaryKey: Boolean(primaryKey),
    });
  }

  renameColumn(from: string, to: string) {
    return this.addCommand(`RENAME COLUMN ${from} TO ${to}`);
  }

  string(columnName: string) {
    return this.addColumn(columnName, "TEXT");
  }

  text(columnName: string) {
    return this.addColumn(columnName, "TEXT");
  }

  timestamps() {
    this.dateTime("created_at");
    this.dateTime("updated_at");
  }

  protected addCommand(command: string) {
    this.commands.push(command);
    return this;
  }

  protected addColumn(
    columnName: string,
    columnType: string,
    options?: ColumnDefinitionOptions
  ) {
    const definition = new ColumnDefinition(columnName, columnType, options);
    this.columns.push(definition);
    return definition;
  }
}

interface ColumnDefinitionOptions {
  primaryKey?: boolean;
}

class ColumnDefinition {
  #nullable = false;
  #unique = false;

  constructor(
    public columnName: string,
    public columnType: string,
    public options?: ColumnDefinitionOptions
  ) {}

  toString() {
    const parts = [this.columnName, this.columnType];

    if (this.options?.primaryKey) {
      parts.push("PRIMARY KEY");
    } else {
      /**
       * Primary key implies that the column is not nullable, so we don't need to
       * add the NOT NULL constraint.
       */
      if (!this.#nullable) {
        parts.push("NOT NULL");
      }
    }

    if (this.#unique) {
      parts.push("UNIQUE");
    }

    return parts.join(" ");
  }

  nullable() {
    this.#nullable = true;
    return this;
  }

  unique() {
    this.#unique = true;
    return this;
  }
}
