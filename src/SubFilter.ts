import { FilterBuilderAdapter } from "./adapters/FilterBuilderAdapter";
import { BaseFilter } from "./BaseFilter";
import { Condition } from "./Condition";
import { FilterBuilderConfig } from "./FilterBuilderConfig";
import {
  ConditionData,
  LogicalOperator,
  OperatorEnum,
  QueryData,
} from "./type";

export class SubFilter<T> extends BaseFilter {
  conditionData: ConditionData;
  private readonly adapter: FilterBuilderAdapter<T>;
  constructor(
    queryData: QueryData,
    target: any,
    path: string,
    config: FilterBuilderConfig,
    adapter: FilterBuilderAdapter<T>
  ) {
    super(queryData, config);
    this.conditionData = {
      path,
      target,
      conditions: [],
    };
    this.adapter = adapter;
  }
  protected processCondition(
    columnName: string,
    operator: OperatorEnum,
    params: any
  ): void {
    this.conditionData.conditions.push({
      columnName,
      operator,
      params,
    });
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
    this.conditionData.attributes = select;
  }

  logicalCondition(operator: LogicalOperator, conditions: Condition[]): this {
    throw new Error("Method not implemented.");
  }
}
