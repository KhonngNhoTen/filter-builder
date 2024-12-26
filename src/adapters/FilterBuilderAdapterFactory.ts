import { AdapterType } from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
import { TypeormFilterBuilderAdapter } from "./TypeormFilterBuilderAdapter";

export class FilterBuilderAdapterFactory {
  static create(
    type: AdapterType = "typeorm",
    opts: {
      core: any;
      page: number;
      limit?: number;
      aliasTableName?: string;
    }
  ): FilterBuilderAdapter {
    if (type === "typeorm")
      return new TypeormFilterBuilderAdapter(
        opts.core,
        opts.page,
        opts.limit,
        opts.aliasTableName
      );

    throw new Error(`Type ${type} is not supports!`);
  }
}
