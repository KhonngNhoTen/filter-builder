import { BaseCondition } from "./BaseCondition";
import {
  BeforeEachConditionDto,
  BeforeOrderHookDto,
  OperatorEnum,
  ParamsOperator,
  QueryData,
  SortOptions,
} from "./type";
import { FilterBuilderAdapter } from "./adapters/FilterBuilderAdapter";
import { FilterBuilderAdapterFactory } from "./adapters/FilterBuilderAdapterFactory";

export class FilterBuilder<T> extends BaseCondition {
  private adapter: FilterBuilderAdapter;
  constructor(instance: T, queryData: QueryData, alias?: string) {
    super(queryData);
    this.adapter = FilterBuilderAdapterFactory.create(this.config.type, {
      core: instance,
      page: queryData.page,
      limit: queryData.limit,
      aliasTableName: alias,
    });
  }

  protected processCondition(
    columName: string,
    operator: OperatorEnum,
    params: ParamsOperator
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

  leftJoin() {}

  innerJoin() {}
}
