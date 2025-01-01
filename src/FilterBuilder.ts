import { BaseCondition } from "./BaseCondition";
import {
  BeforeOrderHookDto,
  InstanceTypeOf,
  OperatorEnum,
  QueryData,
  ResultFilter,
  ResultFilterTransformFuncs,
  SortOptions,
} from "./type";
import { FilterBuilderAdapter } from "./adapters/FilterBuilderAdapter";

export class FilterBuilder<
  U,
  T extends InstanceTypeOf<U>,
> extends BaseCondition {
  private adapter: FilterBuilderAdapter<T>;

  constructor(core: U, queryData: QueryData, aliasTableName?: string) {
    super(queryData);
    const type = this.config.type;
    this.adapter = this.config.factoryAdapter.create(type, this.config, {
      core: core as any,
      ...queryData,
    });
  }

  protected processCondition(
    columName: string,
    operator: OperatorEnum,
    params: any
  ): void {
    this.adapter.handleCondition(columName, operator, params);
  }

  /**
   * Set order clause in query
   * @param columnName column in database
   * @param sortOption defaultValue Sort Options: "DESC" or "ASC"
   * @param queryFieldName fields name in query. Ex: ?age_sort="ASC".
   * queryFieldName is "age_sort"
   */
  order(columnName: string, sortOption?: SortOptions, queryFieldName?: string) {
    sortOption =
      queryFieldName && this.queryData[queryFieldName]
        ? this.queryData[queryFieldName]
        : sortOption;
    if (!sortOption) return this;
    // Run hooks
    let data: BeforeOrderHookDto = { columnName, sortOption };
    data = this.config.runBeforeOrder(data);
    // End Hooks

    data.columnName = this.genAccessFieldName(data.columnName);
    this.adapter.handleOrder(data.columnName, data.sortOption);

    return this;
  }

  /**
   * Set Order clause by combine town field in query
   * @param querySortKey field contain column's name in query.
   * Ex: ?sortKey=age => querySortKey is "sortKey"
   * @param querySortOpts field contain options in query.
   * Ex: ?sortValue=DESC  => querySortOpts is "sortValue"
   */
  orderCombineField(querySortKey: string, querySortOpts: string) {
    if (!this.queryData[querySortKey] || !this.queryData[querySortOpts])
      return this;
    const columnName = this.queryData[querySortKey];
    const sortOpts = this.queryData[querySortOpts].toLocaleUpperCase();
    if (sortOpts !== "DESC" && sortOpts !== "ASC") return this;
    this.order(columnName, sortOpts);
    return this;
  }

  /**
   * Order with stirng in query
   * @param stringOrder the string splits sort-data.
   * Ex: ?sort=age_ASC
   * @param makeSort logic split stringOrder to sort-data
   * @returns
   */
  orderString(
    stringOrder: string,
    makeSort: (str: string) => { columnName: string; opts: SortOptions }
  ) {
    const data = makeSort(stringOrder);
    this.order(data.columnName, data.opts);
    return this;
  }

  group(column: string) {
    // Run hook: Before grouping
    column = this.config.runBeforeGroup(column);
    // End hook: Before grouping

    this.adapter.handleGroup(column);

    return this;
  }

  async run() {
    const { items, total } = await this.adapter.handleRun();
    const data = {
      currentPage: this.queryData.page,
      limit: this.queryData.limit,
      total,
      items,
    };

    return data;
  }

  async transform<V extends any>(
    funcs: ResultFilterTransformFuncs[],
    chunkSize?: number
  ): Promise<ResultFilter<V>> {
    let { items, total } = await this.adapter.handleRun();
    // Set chunkSize
    chunkSize = chunkSize ?? items.length;
    let chunks = this.createChunksItems(items, chunkSize);

    for (let i = 0; i < funcs.length; i++) {
      const func =
        funcs[i].constructor.name === "AsyncFunction"
          ? funcs[i]
          : async (item: any) => funcs[i](item);

      for (let j = 0; j < chunks.length; j++) {
        chunks[j] = await this.transformChunk(chunks[j], func);
      }
    }

    return {
      currentPage: this.queryData.page,
      items: this.parseChunks(chunks) as any[],
      limit: this.queryData.limit,
      total: total,
    };
  }

  private createChunksItems<T>(items: T[], chunkSize: number) {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      chunks.push(chunk);
    }
    return chunks;
  }

  private parseChunks<T>(chunks: T[][]) {
    return chunks.reduce((pre, val) => [...pre, ...val], []);
  }

  private async transformChunk(
    chunk: any[],
    func: (item: any) => Promise<any>
  ) {
    return await Promise.all(chunk.map(async (item) => await func(item)));
  }
}
