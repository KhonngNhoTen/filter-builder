import { BaseCondition } from "./BaseCondition";
import { ConditionData, OperatorEnum, QueryData } from "./type";

export class Condition extends BaseCondition {
  private dataJoin: ConditionData;
  constructor(queryData: QueryData, target: string, prop: any) {
    const name = typeof prop === "string" ? prop : target;
    super(queryData, name);
    this.dataJoin = { target: target, prop, select: [] };
  }

  protected processCondition(
    columnName: string,
    operator: OperatorEnum,
    params: any
  ): void {
    this.dataJoin.select.push({
      columnName,
      operator,
      params,
    });
  }

  build() {
    return this.dataJoin;
  }
}
