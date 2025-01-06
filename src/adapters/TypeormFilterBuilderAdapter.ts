import {
  Brackets,
  DataSource,
  Repository,
  SelectQueryBuilder,
  WhereExpressionBuilder,
} from "typeorm";
import {
  ConditionData,
  LogicalOperator,
  OperatorEnum,
  SortOptions,
} from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
import { SubFilter } from "../SubFilter";

type TypeormFilterBuilderAdapterOptions = {
  dataSource?: DataSource;
};
export class TypeormFilterBuilderAdapter<
  T extends object,
> extends FilterBuilderAdapter<T> {
  protected isFistWhereCondition: boolean = true;
  protected selectQueryBuilder: SelectQueryBuilder<T>;
  protected repository: Repository<any>;
  protected datasource: DataSource;

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
    this.selectQueryBuilder = repo.createQueryBuilder(this.getOwnerName());
    this.repository = repo;
    this.datasource = options.dataSource;
  }

  handleCondition(
    columnName: string,
    operator: OperatorEnum,
    params: object
  ): void {
    this.setConditions(
      this.selectQueryBuilder,
      [{ columnName, operator, params }],
      this.getWhereMethodName()
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

  protected setConditions(
    qb: WhereExpressionBuilder,
    data: { columnName: string; operator: OperatorEnum; params: object }[],
    forceWhereMethod?: "where" | "andWhere"
  ) {
    for (let i = 0; i < data.length; i++) {
      let { columnName, operator, params } = data[i];
      params = this.genUniqueParamsName(columnName, params);
      const fieldNames = Object.keys(params);

      const rightClauseCondition = this.genRightClauseCondition(
        operator,
        fieldNames[0],
        fieldNames[1]
      );
      if (forceWhereMethod) {
        qb[forceWhereMethod](`${columnName} ${rightClauseCondition}`, params);
      }
      if (i === 0) qb.where(`${columnName} ${rightClauseCondition}`, params);
      else qb.andWhere(`${columnName} ${rightClauseCondition}`, params);
    }
  }

  protected getWhereMethodName(): "where" | "andWhere" {
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
    if (this.limit !== "*") cloneSqlBuilder.skip(this.offset).take(this.limit);
    const [total, items] = await Promise.all([
      this.selectQueryBuilder.getCount(),
      cloneSqlBuilder.getMany(),
    ]);
    return {
      total,
      items,
    };
  }

  handleJoin(dataJoin: ConditionData, required: boolean): void {
    const joinMethod = required ? "innerJoinAndSelect" : "leftJoinAndSelect";
    this.selectQueryBuilder[joinMethod](dataJoin.path, dataJoin.path);
    dataJoin.conditions.forEach((val) =>
      this.handleCondition(
        `${dataJoin.path}.${val.columnName}`,
        val.operator,
        val.params
      )
    );

    // Handle select attribute
    if (dataJoin.attributes)
      this.handleSelect(dataJoin.attributes, dataJoin.path);
  }

  getColumns(target?: any): Record<string, any> {
    const repository = target
      ? this.datasource.getRepository(target)
      : this.repository;
    return repository.metadata.columns.reduce(
      (pre, val) => ({ ...pre, [val.propertyName]: val }),
      {}
    );
  }

  handleSelect(attribute: string[], path?: string): void {
    const selectMethod = path ? "select" : "addSelect";
    attribute = attribute.map((val) => (path ? `${path}.${val}` : val));
    this.selectQueryBuilder[selectMethod](attribute);
  }

  handleLogicalOperator<U>(
    operator: LogicalOperator,
    subFilters: SubFilter<U>[]
  ): void {
    const logicalMethod = operator === "OR" ? "orWhere" : "andWhere";
    const whereMethod = this.getWhereMethodName();

    this.selectQueryBuilder[whereMethod](
      new Brackets((qb) => {
        let subFilter = subFilters[0];
        qb.where(
          new Brackets((_qb) =>
            this.setConditions(_qb, subFilter.conditionData.conditions)
          )
        );

        for (let i = 1; i < subFilters.length; i++) {
          subFilter = subFilters[i];
          qb[logicalMethod](
            new Brackets((_qb) =>
              this.setConditions(_qb, subFilter.conditionData.conditions)
            )
          );
        }
      })
    );
  }
}
