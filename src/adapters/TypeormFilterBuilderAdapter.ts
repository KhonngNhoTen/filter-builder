import { ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import {
  OperatorEnum,
  ParamsOperator,
  ResultFilter,
  SortOptions,
} from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
import { BaseCondition } from "../BaseCondition";

export class TypeormFilterBuilderAdapter<
  T extends ObjectLiteral,
> extends FilterBuilderAdapter {
  protected isFistWhereCondition: boolean = true;
  protected selectQueryBuilder: SelectQueryBuilder<T>;

  constructor(
    repo: Repository<T>,
    page: number,
    limit?: number,
    alias?: string
  ) {
    const tableName = alias ?? repo.metadata.tableName;
    super(tableName, page, limit);
    this.selectQueryBuilder = repo.createQueryBuilder(this.getTableName());
  }

  handleCondition(
    columnName: string,
    operator: OperatorEnum,
    params: object
  ): void {
    params = this.genUniqueParamsName(params);
    const fieldNames = Object.keys(params);

    const rightClauseCondition = this.genRightClauseCondition(
      operator,
      fieldNames[0],
      fieldNames[1]
    );
    const whereMethod = this.getWhereMethodName();

    this.selectQueryBuilder[whereMethod](
      `${columnName} ${rightClauseCondition}`,
      { params }
    );
  }

  handleOrder(columName: string, sortOpts: SortOptions): void {
    this.selectQueryBuilder.orderBy(columName, sortOpts);
  }

  handleGroup(columnName: string): void {
    this.selectQueryBuilder.groupBy(columnName);
  }

  handleHaving(): void {
    throw new Error("Method not implemented.");
  }

  private getWhereMethodName(): "where" | "andWhere" {
    const methodName: "where" | "andWhere" = this.isFistWhereCondition
      ? "where"
      : "andWhere";
    this.isFistWhereCondition = false;
    return methodName;
  }

  async run(): Promise<ResultFilter<T>> {
    const cloneSqlBuilder = this.selectQueryBuilder.clone();
    if (this.offset && this.limit)
      cloneSqlBuilder.skip(this.offset).take(this.limit);

    try {
      const [total, items] = await Promise.all([
        this.selectQueryBuilder.getCount(),
        cloneSqlBuilder.getMany(),
      ]);
      return {
        currentPage: this.page,
        limit: this.limit || null,
        total,
        items: items,
      };
    } catch (error) {
      console.error("Filter error!!", error);
      throw error;
    }
  }

  /**
   * Gen right clause of where clause. It depends on the operator;
   * the structure of the right-hand side will vary
   */
  protected genRightClauseCondition(
    operator: OperatorEnum,
    param: string,
    param2?: string
  ): string {
    if (operator === "ILIKE" || operator === "LIKE")
      return `${operator} %:${param}%`;
    if (operator === "IN") return `IN (...:${param})`;
    if (operator === "BETWEEN") {
      return `BETWEEN :${param} AND :${param2}`;
    }
    return `${operator} :${param}`;
  }

  /** Convert columnName for where-clause params */
  protected genUniqueParamsName(params: ParamsOperator) {
    const uniqueName = (columnName: string) => columnName + "_" + Date.now();

    const key = Object.keys(params)[0];
    const value = params[key];

    const newParams = Array.isArray(value)
      ? {
          [uniqueName(`${key}_1`)]: value[0],
          [uniqueName(`${key}_2`)]: value[1],
        }
      : { [uniqueName(key)]: value };

    return newParams;
  }
}
