import { Model } from "sequelize";
import { OrmRelationshipManagement } from "../OrmRelationshipManagement";

export class SequelizeRelationshipManagement extends OrmRelationshipManagement {
  protected createAlias(containerPath: string, relationPath: string, relation: any): string {
    if (this.targets[relationPath]) return this.targets[relationPath].alias;
    if (relation) {
      if (!this.targets[containerPath]) throw new Error(`Path ${containerPath} not exists`);
      const container = this.targets[containerPath].value;
      return this.findRelation(container, relation as typeof Model);
    } else {
      if (!this.targets[containerPath]) throw new Error(`Path ${containerPath} not exists`);
      return this.targets[containerPath].alias;
    }
  }

  protected findRelation(containerModel: typeof Model, componentModel: typeof Model): string {
    for (const [as, model] of Object.entries(containerModel.associations)) {
      if (model.target.tableName === componentModel.tableName) return model.as;
    }
    throw new Error(`Not find relation ${containerModel.name} - ${componentModel.name}`);
  }
}
