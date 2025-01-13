import { SubFilter } from "../SubFilter";
import {
  ConditionData,
  JoinData,
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

type MyFindOptions<T> = Omit<FindOptions, "include"> & {
  include?: IncludeOptions[];
  order?: [][];
};

export class SequelizeFilterBuilderAdapter<T> extends FilterBuilderAdapter<T> {
  protected readonly model: T;
  protected myName: string;
  protected dataJoinMap: any = {};

  // protected include: IncludeOptions[] = [];
  protected where: WhereOptions<T> = {};

  protected selectData: MyFindOptions<T> = {};

  constructor(model: T, page: number, limit?: number, alias?: string) {
    const tableName = (model as any).tableName;
    super(tableName, page, limit);
    this.model = model as any;
    this.myName = (model as any).name ?? alias;
    this.dataJoinMap = { [alias ?? tableName]: undefined };
    this.targets[""] = model;
  }

  handleCondition(condition: ConditionData): void {
    const conditionObj = this.parseConditions([condition]);
    /** If condition in where-clause is "and"|"or" */
    if ((this.where as any)[Op.and] || (this.where as any)[Op.or]) {
      this.where = this.concatLogicalWhere(this.where, conditionObj);
    } else this.where = { ...this.where, ...conditionObj };
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
    // if (this.include) dataSelect.include = this.include;
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

  handleJoin(dataJoin: JoinData): void {
    if (!this?.selectData.include) this.selectData.include = [];
    const path = dataJoin.path;
    const include: IncludeOptions = {
      required: dataJoin.required,
      as: path,
      model: dataJoin.target,
      where: {},
    };

    // Add condition into include-clause
    if (dataJoin.conditions)
      include.where = this.parseConditions(dataJoin.conditions);
    const lastDotPosition = path.lastIndexOf(".");
    let parentInclude: any =
      lastDotPosition === -1
        ? this.selectData
        : this.findIncludeObjectByPath(path.slice(0, lastDotPosition));

    if (parentInclude && !parentInclude?.include)
      parentInclude.include = [include];
    else if (parentInclude && Array.isArray(parentInclude.include))
      parentInclude.include.push(include);

    // Handle select attributes
    if (dataJoin.attributes)
      this.handleSelect(dataJoin.attributes, undefined, include);

    // Disable subQuery
    this.selectData.subQuery = false;

    // Finnally, add target into this.targets
    super.handleJoin(dataJoin);
  }

  getColumns(target?: any): Record<string, any> {
    if (!target) target = this.model;

    const dataValues = target.getAttributes();
    if (!dataValues) throw new Error("Model's datavalues is null");
    return dataValues;
  }

  handleSelect(
    attribute: string[],
    path?: string,
    includeObject?: IncludeOptions | FindOptions<any>
  ): void {
    if (path) includeObject = this.findIncludeObjectByPath(path);
    else if (!includeObject) includeObject = this.selectData;

    if (includeObject.attributes && Array.isArray(includeObject.attributes))
      includeObject.attributes.push(...attribute);
    else includeObject.attributes = attribute;
  }

  handleLogicalOperator<U>(
    operator: LogicalOperator,
    subFilters: SubFilter<U>[]
  ): void {
    const op = operator === "AND" ? Op.and : Op.or;
    const conditions: any[] = [];
    for (let i = 0; i < subFilters.length; i++) {
      const conditionData = subFilters[i].conditionData;
      if (conditionData.path === "" && conditionData.conditions)
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

    this.where = this.concatLogicalWhere(this.where, { [op]: conditions });
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
    // else if (operator === "BETWEEN") params = params;

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
   * So, IncludeObject represents a Target in FilterBuilder.
   * Using path to find IncludeObject equivalent to using path to find Target
   * @param path Include Object's path
   * @returns
   */
  findIncludeObjectByPath(path: string | string[]) {
    if (!Array.isArray(path)) path = path.split(".");
    let currentAlias = "";
    let current: IncludeOptions | null = this.selectData;
    for (let i = 0; i < path.length; i++) {
      const joinName = path[i];
      currentAlias =
        currentAlias === "" ? joinName : `${currentAlias}.${joinName}`;
      let find;
      if (
        !current?.include ||
        (find = current.include.findIndex(
          (val: any) => val.as === currentAlias
        )) === -1
      ) {
        current = null;
        break;
      }
      current = current.include[find] as IncludeOptions;
    }

    if (!current)
      throw new Error("Not found include object with path: " + currentAlias);
    return current;
  }

  /**
   * Concat current where object with logical operator
   * @returns
   */
  private concatLogicalWhere(whereClause: any, conditions: any) {
    const isEmpty = (obj: any) => Object.entries(obj).length === 0;
    const isLogicOperator = (obj: any): boolean =>
      obj[Op.and] !== undefined || obj[Op.or] !== undefined;

    if (isEmpty(whereClause) && !isLogicOperator(whereClause))
      return conditions;

    return {
      [Op.and]: [
        ...(!isLogicOperator(whereClause)
          ? Object.keys(whereClause).map((key) => ({ [key]: whereClause[key] }))
          : [whereClause]),
        conditions,
      ],
    };
  }
}
