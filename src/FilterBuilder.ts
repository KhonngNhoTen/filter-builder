import { BaseFilter } from "./BaseFilter";
import {
  BeforeOrderHookDto,
  InstanceTypeOf,
  LogicalOperator,
  OperatorEnum,
  QueryData,
  ResultFilter,
  ResultFilterTransformFuncs,
  SortOptions,
} from "./type";
import { FilterBuilderAdapter } from "./adapters/FilterBuilderAdapter";
import { Condition } from "./Condition";
import { SubFilter } from "./SubFilter";

export class FilterBuilder<U, T extends InstanceTypeOf<U>> extends BaseFilter {
  private adapter: FilterBuilderAdapter<T>;
  private core: U;

  constructor(mainTarget: U, queryData: QueryData, aliasTableName?: string) {
    super(queryData);
    const type = this.config.type;
    this.core = mainTarget;
    this.adapter = this.config.factoryAdapter.create({
      config: this.config,
      mainTarget: mainTarget as any,
      type,
      aliasTableName,
      page: queryData?.page ?? 1,
      limit: queryData.limit,
    });
  }

  protected processCondition(
    columnName: string,
    operator: OperatorEnum,
    params: any
  ): void {
    this.adapter.handleCondition({ columnName, operator, params, path: "" });
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
      currentPage: this.queryData.page ?? 1,
      items: this.parseChunks(chunks) as any[],
      limit: this.queryData.limit ?? items.length,
      total: total,
    };
  }

  leftJoin(target: any, path: string, attributes?: string[]): this;
  leftJoin(target: Condition): this;
  leftJoin(target: Condition | any, path?: string, attributes?: string[]) {
    this.join(false, target, path, attributes);
    return this;
  }

  innerJoin(target: any, path: string, attributes?: string[]): this;
  innerJoin(target: Condition): this;
  innerJoin(target: any, path?: string, attributes?: string[]) {
    this.join(true, target, path, attributes);
    return this;
  }

  /**
   * Join current table with target. Depends on "required" param,
   * method join is leftJoin or innerJoin.
   * @param required - False is leftJoin, True is innerJoin
   * @param target - model (entity) needs join or Condition instance.
   * @param path - path data of result filter.
   * @param attributes - attributes in table join.
   */
  private join(
    required: boolean,
    target: Condition | any,
    path?: string,
    attributes?: string[]
  ) {
    let subFilter: SubFilter<T> | undefined = undefined;
    if (target instanceof Condition)
      subFilter = target.build({
        queryData: this.queryData,
        adapter: this.adapter,
        config: this.config,
      });
    else if (path) {
      subFilter = new SubFilter(
        this.queryData,
        this.adapter,
        path,
        target,
        this.config
      );
      if (attributes) subFilter.attributes(attributes);
    }
    if (!subFilter) throw new Error("Build SubFilter is fail.");

    let subdata = subFilter.conditionData;
    // Run hook
    subdata = this.config.runBeforeJoin(subdata);
    // End hook
    subdata.required = required;
    this.adapter.handleJoin(subdata);
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

  protected select(attributes?: string[], skips?: string[] | "*"): void {
    let select: string[] = [];
    if (attributes) select = attributes;
    else if (skips === "*") select = [];
    else if (skips) {
      const columns = Object.keys(this.adapter.getColumns());
      columns.forEach((val) =>
        !skips.includes(val) ? select.push(val) : null
      );
    }

    this.adapter.handleSelect(select);
  }

  logicalCondition(operator: LogicalOperator, conditions: Condition[]): this {
    throw new Error("Method not implemented.");
  }
}
