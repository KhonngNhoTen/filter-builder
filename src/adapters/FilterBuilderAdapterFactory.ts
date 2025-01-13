import { AdapterType, FilterBuilderAdapterFactoryOptions } from "../type";
import { SequelizeFilterBuilderAdapter } from "./SequelizeFilterBuilderAdapter";
import { TypeormFilterBuilderAdapter } from "./TypeormFilterBuilderAdapter";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
import { FilterBuilderConfig } from "../FilterBuilderConfig";

export class FilterBuilderAdapterFactory {
  static create<T extends object>(
    opts: FilterBuilderAdapterFactoryOptions<T>
  ): FilterBuilderAdapter<T> {
    if (opts.type === "typeorm")
      return new TypeormFilterBuilderAdapter(
        opts.mainTarget,
        opts.page,
        opts.limit,
        opts.aliasTableName,
        { dataSource: opts.config.dataSource }
      );
    if (opts.type === "sequelize")
      return new SequelizeFilterBuilderAdapter(
        opts.mainTarget,
        opts.page,
        opts.limit,
        opts.aliasTableName
      );

    throw new Error(`Type ${opts.type} is not supports!`);
  }
}
