import { AdapterType } from "../type";
import { SequelizeFilterBuilderAdapter } from "./SequelizeFilterBuilderAdapter";
import { TypeormFilterBuilderAdapter } from "./TypeormFilterBuilderAdapter";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
import { FilterBuilderConfig } from "../FilterBuilderConfig";

export class FilterBuilderAdapterFactory {
  static create<T extends object>(
    type: AdapterType = "typeorm",
    config: FilterBuilderConfig,
    opts: {
      core: T;
      page: number;
      limit?: number;
      aliasTableName?: string;
    }
  ): FilterBuilderAdapter<T> {
    if (type === "typeorm")
      return new TypeormFilterBuilderAdapter(
        opts.core,
        opts.page,
        opts.limit,
        opts.aliasTableName,
        { dataSource: config.dataSource }
      );
    if (type === "sequelize")
      return new SequelizeFilterBuilderAdapter(
        opts.core,
        opts.page,
        opts.limit,
        opts.aliasTableName
      );

    throw new Error(`Type ${type} is not supports!`);
  }
}
