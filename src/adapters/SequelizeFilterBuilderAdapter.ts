import { SubFilter } from "../SubFilter";
import {
  ConditionData,
  LogicalOperator,
  OperatorEnum,
  SortOptions,
} from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
import {
  Op,
  FindOptions,
  IncludeOptions,
  where,
  Model,
  WhereOptions,
} from "sequelize";
export class SequelizeFilterBuilderAdapter<T> extends FilterBuilderAdapter<T> {
  protected readonly model: T;
  protected myName: string;
  protected dataJoinMap: any = {};

  protected include?: IncludeOptions[];
  protected where: WhereOptions = {};

  protected selectData: FindOptions<T> = {
    order: [] as [string, string][],
  };

  constructor(model: T, page: number, limit?: number, alias?: string) {
    const tableName = (model as any).tableName;
    super(tableName, page, limit);
    this.model = model as any;
    this.myName = (model as any).name ?? alias;
    this.dataJoinMap = { [alias ?? tableName]: undefined };
  }

  handleCondition(
    columnName: string,
    operator: OperatorEnum,
    params: any
  ): void {
    if (!this.selectData?.where) this.where = {};
    const condition = this.parseConditions([{ columnName, operator, params }]);
    const checkOperator = Object.keys(this.where)[0];
    if (checkOperator && Array.isArray((this.where as any)[checkOperator])) {
      (this.where as any)[checkOperator].push(condition);
    } else this.where = condition;
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
      where: this.where,
    };
    if (this.include) dataSelect.include = this.include;
    if (this.limit !== "*") {
      dataSelect.limit = this.limit;
      dataSelect.offset = this.offset;
    }

    const countFunc = (this.model as any).count({
      ...this.selectData,
      where: this.where,
    }) as unknown as number;
    const findMany = (this.model as any).findAll(
      dataSelect
    ) as unknown as any[];

    const [total, items] = await Promise.all([countFunc, findMany]);

    return { total, items };
  }

  handleJoin(dataJoin: ConditionData, required: boolean): void {
    if (!this?.include) this.include = [];
    const path = dataJoin.path.split(".");
    const parentInclude = this.findContainIncludeByPath(path);

    const include: IncludeOptions = {
      required,
      as: path[path.length - 1],
      model: dataJoin.target,
      where: {},
      subQuery: false,
    };

    // Add condition into include-clause
    include.where = this.parseConditions(dataJoin.conditions);

    if (!parentInclude.include) parentInclude.include = [];
    parentInclude.include.push(include);

    // Handle select attributes
    if (dataJoin.attributes)
      this.handleSelect(dataJoin.attributes, undefined, include);
  }

  getColumns(target?: any): Record<string, any> {
    if (!target) target = this.model;

    const dataValues = target?.prototype?.dataValues;
    if (!dataValues) throw new Error("Model's datavalues is null");
    return dataValues;
  }

  handleSelect(
    attribute: string[],
    path?: string,
    includeObject?: IncludeOptions | FindOptions
  ): void {
    if (path)
      includeObject = includeObject ?? this.findContainIncludeByPath(path);
    else includeObject = this.selectData;
    includeObject.attributes = attribute;
  }

  handleLogicalOperator<U>(
    operator: LogicalOperator,
    subFilters: SubFilter<U>[]
  ): void {
    const op = operator === "AND" ? Op.and : Op.or;
    const conditions: any[] = [];
    for (let i = 0; i < subFilters.length; i++) {
      const conditionData = subFilters[i].conditionData;
      if (conditionData.path === "")
        conditions.push(this.parseConditions(conditionData.conditions));
      else
        conditions.push(
          this.parseConditions(
            conditionData.conditions.map((val) => ({
              ...val,
              columnName: `$${this.genAlias(conditionData.path)}.${val.columnName}$`,
            }))
          )
        );
    }

    this.where = {
      [Op.and]: [this.where, { [op]: conditions }],
    };
  }

  //
  //
  //  Function of Sequelize Adapter
  //
  //

  /**
   * Convert OperatorEnum to Op in Sequelize. And set params for fields
   * @param operator
   * @param params
   * @returns
   */
  genOperator(operator: Exclude<OperatorEnum, "OR">, params: any) {
    const mapOperators: Record<Exclude<OperatorEnum, "OR">, keyof typeof Op> = {
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

    if (operator === "ILIKE" || operator === "LIKE") params = `%${params}%`;
    else if (operator === "BETWEEN") params = `(${params.toString()})`;

    return { [Op[mapOperators[operator]]]: params };
  }

  /**
   * Parse rawCondition to WhereOptions in Sequelize
   * @param conditions List of information conditions
   * @returns
   */
  parseConditions(
    conditions: {
      columnName: string;
      operator: OperatorEnum;
      params: any;
    }[]
  ) {
    return conditions.reduce(
      (pre, e) => ({
        ...pre,
        [e.columnName]: this.genOperator(e.operator, e.params),
      }),
      {}
    );
  }

  /**
   * In Sequelize, To get linked table, using include object (list of IncludeOptions).
   *
   * Ex: User.find(include:[<Student...>]), the User joinning to Student.
   *
   * In FilterBuilder, the IncludeObject is represented by the path.
   *
   * Ex: User.find(include:[<Student...>, include: [<...Course>]]).
   * The Student's path is: "Student".
   * The Course's path is "Student.Course".
   *
   * So, to set link between town tables, you can use path to find IncludeObject
   * @param path Include Object's path
   * @returns
   */
  protected findContainIncludeByPath(path: string | string[]): {
    include: any[];
  } {
    if (!Array.isArray(path)) path = path.split(".");
    let currInclude = null,
      parentInclude = null;

    for (let i = 0; i < path.length; i++) {
      const joinName = path[i];
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

    if (!parentInclude) throw new Error(`Not found in join object`);

    return parentInclude;
  }
}
