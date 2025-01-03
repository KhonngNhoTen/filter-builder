import { ConditionData, OperatorEnum, SortOptions } from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
import { Op, FindOptions, IncludeOptions } from "sequelize";
export class SequelizeFilterBuilderAdapter<T> extends FilterBuilderAdapter<T> {
  protected readonly model: T;
  protected myName: string;
  protected dataJoinMap: any = {};

  protected include?: IncludeOptions[];

  protected selectData: FindOptions<T> = {
    where: {},
    order: [] as [string, string][],
    limit: 0,
    offset: 0,
  };
  constructor(model: T, page: number, limit?: number, alias?: string) {
    const tableName = (model as any).tableName;
    super(tableName, page, limit);
    this.model = model as any;
    this.myName = (model as any).name ?? alias;
    this.dataJoinMap = { [alias ?? tableName]: undefined };
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

    return { [Op[mapOperators[operator]]]: params };
  }

  handleCondition(
    columnName: string,
    operator: OperatorEnum,
    params: any
  ): void {
    this.selectData.where = {
      ...this.selectData.where,
      [columnName]: this.genOperator(operator, params),
    } as any;
  }

  handleOrder(columName: string, sortOpts: SortOptions): void {
    if (!this.selectData?.order) this.selectData.order = [];
    (this.selectData.order as [string, string][]).push([
      columName,
      sortOpts as string,
    ]);
  }
  handleGroup(columnName: string): void {
    throw new Error("Method not implemented.");
  }
  handleHaving(): void {
    throw new Error("Method not implemented.");
  }

  async handleRun() {
    const dataSelect: FindOptions<T> = {
      ...(this.selectData as any),
      limit: this.limit,
      offset: this.offset,
    };
    if (this.include) dataSelect.include = this.include;

    const countFunc = (this.model as any).count(
      this.selectData as any
    ) as unknown as number;
    const findMany = (this.model as any).findAll(
      dataSelect
    ) as unknown as any[];

    const [total, items] = await Promise.all([countFunc, findMany]);

    return { total, items };
  }

  // handleJoin(dataJoin: ConditionData, required: boolean): void {
  //   const joinNames = dataJoin.target.split(".");
  //   if (!this.selectData?.include) this.selectData.include = {};

  //   let parentJoin = null;
  //   let currentJoin = null;

  //   for (let i = 0; i < joinNames.length; i++) {
  //     const joinName = joinNames[i];
  //     parentJoin = currentJoin;
  //     const dataJoinMap: any = i === 0 ? this.dataJoinMap : parentJoin;
  //     currentJoin = dataJoinMap ? dataJoinMap[joinName] : null;
  //     if (!currentJoin) break;
  //   }

  //   if (!parentJoin)
  //     throw new Error(`${dataJoin.target} not found in join clause`);
  // }

  handleJoin(dataJoin: ConditionData, required: boolean): void {
    const joinNames = dataJoin.target.split(".");
    if (!this?.include) this.include = [];

    let currInclude = null,
      parentInclude = null;

    for (let i = 0; i < joinNames.length; i++) {
      const joinName = joinNames[i];
      parentInclude = currInclude;
      const parent: any = i === 0 ? this.include : parentInclude;

      const foundIndex = (parent as []).findIndex(
        (e: any) => e.as === joinName
      );

      if (foundIndex < 0) {
        currInclude = null;
        break;
      }
      currInclude = parent[foundIndex];
    }

    if (!parentInclude)
      throw new Error(`${dataJoin.target} not found in join clause`);

    parentInclude = {
      where: {},
      required,
    };

    dataJoin.select.forEach((e) => {
      parentInclude.where = {
        ...parentInclude.where,
        [e.columnName]: this.genOperator(e.operator, e.params),
      };
    });
  }
}
