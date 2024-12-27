import { FindManyOptions } from "typeorm";
import { OperatorEnum, SortOptions } from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
import { Model, Op } from "sequelize";

class BaseModel<T extends {}, U extends {}> extends Model<T, U> {}
export class SequelizeFilterBuilderAdapter<
  T extends Model,
> extends FilterBuilderAdapter<T> {
  protected readonly model: typeof BaseModel<T, T>;

  protected selectData: FindManyOptions = { where: {} };
  constructor(
    model: typeof BaseModel,
    page: number,
    limit?: number,
    alias?: string
  ) {
    const tableName = model.tableName;
    super(tableName, page, limit);
    this.model = model;
  }

  genOperator(operator: OperatorEnum, params: any) {
    const mapOperators: Record<OperatorEnum, keyof typeof Op> = {
      "<": "lt",
      "<=": "lte",
      "=": "eq",
      ">": "gt",
      ">=": "gte",
      BETWEEN: "between",
      ILIKE: "iLike",
      LIKE: "like",
      IN: "in",
    };

    return { [mapOperators[operator]]: params };
  }

  handleCondition(
    columnName: string,
    operator: OperatorEnum,
    params: any
  ): void {
    this.selectData.where = {
      [columnName]: this.genOperator(operator, params),
    };
  }

  handleOrder(columName: string, sortOpts: SortOptions): void {
    if (!this.selectData?.order) this.selectData.order = {};
    this.selectData.order = { ...this.selectData.order, [columName]: sortOpts };
  }
  handleGroup(columnName: string): void {
    throw new Error("Method not implemented.");
  }
  handleHaving(): void {
    throw new Error("Method not implemented.");
  }

  async handleRun(): Promise<{ total: number; items: T[] }> {
    const countFunc = this.model.count(
      this.selectData as any
    ) as unknown as number;
    const findMany = this.model.findAll({
      ...(this.selectData as any),
      limit: this.limit,
      offset: this.offset,
    }) as unknown as any[];

    const [total, items] = await Promise.all([countFunc, findMany]);

    return { total, items };
  }
}
