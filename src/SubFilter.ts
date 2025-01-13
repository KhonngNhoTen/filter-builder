import { FilterBuilderAdapter } from "./adapters/FilterBuilderAdapter";
import { BaseFilter } from "./BaseFilter";
import { Condition } from "./Condition";
import { FilterBuilderConfig } from "./FilterBuilderConfig";
import {
  ConditionData,
  JoinData,
  LogicalOperator,
  OperatorEnum,
  QueryData,
} from "./type";

export class SubFilter<T> extends BaseFilter {
  conditionData: JoinData;
  private readonly adapter: FilterBuilderAdapter<T>;

  constructor(
    queryData: QueryData,
    adapter: FilterBuilderAdapter<T>,
    path?: string,
    target?: any,
    config?: FilterBuilderConfig
  ) {
    super(queryData, config);
    this.conditionData = {
      path: path ?? "",
      target,
      conditions: [],
    };
    this.adapter = adapter;

    this.conditionData.path = path ? path : "";
    this.conditionData.target = target
      ? target
      : this.adapter.getTargetByPath(this.conditionData.path);
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
      path: this.conditionData.path,
    });
  }

  protected select(attributes?: string[], skips?: string[] | "*"): void {
    let select: string[] = [];
    if (attributes) select = attributes;
    else if (skips === "*") select = [];
    else if (skips) {
      const columns = Object.keys(
        this.adapter.getColumns(this.conditionData.target)
      );
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
