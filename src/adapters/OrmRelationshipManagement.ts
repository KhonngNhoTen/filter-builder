export abstract class OrmRelationshipManagement {
  /**
   * The hash-map contais all Target in FilterBuilder.
   *
   * The Target is ORM-class. It represents to a table in database.
   * EX: With Sequelize, Target is a class extends Model. With Typeorm,
   * Target is a Entity.
   *
   * Each Target is linked by path. Path has value is "", links to Main Target in FilterBuilder.
   *
   * On relationship of between two targets. Target wraps other, is called Target-Container or Container.
   * Otherhands, it is called Target-Component or Component.
   * Main Target - is highest target, is called Root.
   *
   */
  protected targets: Record<string, OrmRelationship> = {};
  protected rootKey = "";
  protected options: any = {};

  constructor(options: any) {
    this.options = options;
  }

  init(value: any, rootKey?: string) {
    this.rootKey = rootKey ?? "";
    this.targets[""] = {
      alias: this.rootKey,
      // propertyPath: this.rootKey,
      deepAlias: this.rootKey,
      value: this.getValue(value),
      shortPath: "",
    };
  }

  protected abstract createAlias(containerPath: string, relationPath: string, relation?: any): string;

  protected abstract getValue(value: any): any;

  protected createDeepAlias(containerPath: string, alias: string): string {
    const containerAlias = this.targets[containerPath];

    if (containerAlias) {
      if (containerAlias.deepAlias === this.rootKey) return alias;
      return `${containerAlias.deepAlias}.${alias}`;
    }

    throw new Error(`${this.targets[containerPath]} not exists!!`);
  }

  protected getContainerPath(path: string) {
    if (path === "") return "";
    const paths = path.split(".");
    paths.pop();
    if (paths.length === 0) return "";
    return paths.join(".");
  }

  public addRelationship(relationPath: string, relation: any, shortPath?: string): OrmRelationship {
    relation = this.getValue(relation);
    const containerPath = this.getContainerPath(relationPath);
    const alias = this.createAlias(containerPath, relationPath, relation);
    const deepAlias = this.createDeepAlias(containerPath, alias);
    this.targets[relationPath] = {
      alias,
      deepAlias,
      value: relation,
      shortPath,
    };
    return this.targets[relationPath];
  }

  public findPath(path: string) {
    return this.targets[path];
  }

  public findAlias(alias: string) {
    const keys = Object.keys(this.targets);
    const index = keys.findIndex((key) => this.targets[key].alias === alias);
    if (index === -1) return null;

    return this.targets[keys[index]];
  }

  public findDeepAlias(deepAlias: string) {
    const keys = Object.keys(this.targets);
    const index = keys.findIndex((key) => this.targets[key].deepAlias === deepAlias);
    if (index === -1) return null;

    return this.targets[keys[index]];
  }

  public findShortPath(shortPath: string) {
    const keys = Object.keys(this.targets);
    const index = keys.findIndex((key) => this.targets[key].shortPath === shortPath);
    if (index === -1) return null;

    return this.targets[keys[index]];
  }
}

type OrmRelationship = {
  alias: string;
  deepAlias: string;
  // propertyPath: string;
  value: any;
  shortPath?: string;
};
