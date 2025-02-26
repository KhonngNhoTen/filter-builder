import { DataSource, EntityMetadata } from "typeorm";
import { OrmRelationshipManagement } from "../OrmRelationshipManagement";

type TypeormRelationshipManagementOpts = {
  dataSource: DataSource;
};

export class TypeormRelationshipManagement extends OrmRelationshipManagement {
  protected options: TypeormRelationshipManagementOpts;
  constructor(options: TypeormRelationshipManagementOpts) {
    super(options);
    this.options = options;
  }
  protected getValue(value: any) {
    return this.options.dataSource.getRepository(value).metadata;
  }
  protected createAlias(containerPath: string, relationPath: string, relation: EntityMetadata): string {
    if (this.findPath(relationPath)) return this.findPath(relationPath).alias;
    const container = this.findMetaByPath(containerPath);
    const index = container.relations.findIndex((target) => target.inverseEntityMetadata.tableName === relation.tableName);
    if (index < 0) throw new Error(`Not relationship: ${relationPath}`);
    return container.relations[index].propertyPath;
  }

  protected override createDeepAlias(containerPath: string, alias: string): string {
    const container = this.findPath(containerPath);
    return `${container.alias}.${alias}`;
  }

  protected findMetaByPath(path: string): EntityMetadata {
    const current = this.targets[path];
    if (!current) throw new Error("Not found include object with path: " + path);
    return current.value;
  }
}
