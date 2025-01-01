import { DataSource, SelectQueryBuilder } from "typeorm";
import { OperatorEnum, SortOptions } from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";

type TypeormFilterBuilderAdapterOptions = {
  dataSource?: DataSource;
};
export class TypeormFilterBuilderAdapter<
  T extends object,
> extends FilterBuilderAdapter<T> {
  protected isFistWhereCondition: boolean = true;
  protected selectQueryBuilder: SelectQueryBuilder<T>;

  constructor(
    entity: T,
    page: number,
    limit?: number,
    alias?: string,
    options?: TypeormFilterBuilderAdapterOptions
  ) {
    if (!options?.dataSource)
      throw new Error("You must set dataSource when using TypeOrmAdapter");
    const repo = options.dataSource.getRepository(
      entity as object & { name: string; type: T }
    );
    const tableName = repo.metadata.tableName;
    super(tableName, page, limit);
    this.selectQueryBuilder = repo.createQueryBuilder(this.getTableName());
  }

  handleCondition(
    columnName: string,
    operator: OperatorEnum,
    params: object
  ): void {
    params = this.genUniqueParamsName(columnName, params);
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
  protected genUniqueParamsName(columnName: string, params: any) {
    const uniqueName = (columnName: string) => columnName + "_" + Date.now();

    const newParams = Array.isArray(params)
      ? {
          [uniqueName(`${columnName}_1`)]: params[0],
          [uniqueName(`${columnName}_2`)]: params[1],
        }
      : { [uniqueName(columnName)]: params };

    return newParams;
  }

  async handleRun() {
    const cloneSqlBuilder = this.selectQueryBuilder.clone();
    if (this.offset && this.limit)
      cloneSqlBuilder.skip(this.offset).take(this.limit);
    const [total, items] = await Promise.all([
      this.selectQueryBuilder.getCount(),
      cloneSqlBuilder.getMany(),
    ]);
    return {
      total,
      items,
    };
  }
}
