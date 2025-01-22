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
  Includeable,
} from "sequelize";

type MyFindOptions<T> = Omit<FindOptions, "include"> & {
  include?: IncludeOptions[];
  order?: [][];
};

export class SequelizeFilterBuilderAdapter<T> extends FilterBuilderAdapter<T> {
  protected readonly model: T;
  protected myName: string;
  protected dataJoinMap: any = {};

  protected where: WhereOptions<T> = {};
  /**
   * On relationship of between two targets. Target wraps other, is called Target-Container or Container.
   * Otherhands, it is called Target-Component or Component.
   * Main Target - is highest target, is called Root.
   * Example, in bellow relationship:
   * ```js
   * Student.join(Course)
   * ```
   * `Student` is a `Container`. `Course` is a `Component`
   */
  protected rootContainer: Record<string, IncludeOptions>;

  protected selectData: MyFindOptions<T> = {};

  constructor(model: T, page: number, limit?: number, alias?: string) {
    const tableName = (model as any).tableName;
    super(tableName, page, limit);
    this.model = model as any;
    this.myName = (model as any).name ?? alias;
    this.dataJoinMap = { [alias ?? tableName]: undefined };
    this.targets[""] = model;
    this.rootContainer = { "": {} };
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

  handleJoin(dataJoin: JoinData): void {
    if (!this?.selectData.include) this.selectData.include = [];
    const path = dataJoin.path;
    const lastDotPosition = path.lastIndexOf(".");
    const alias = this.getAlias(
      lastDotPosition === -1 ? "" : path.slice(0, lastDotPosition),
      dataJoin.target
    );
    const component: IncludeOptions = {
      required: dataJoin.required,
      as: alias,
      model: dataJoin.target,
      where: {},
    };

    // Add condition into component-clause
    if (dataJoin.conditions)
      component.where = this.parseConditions(dataJoin.conditions);
    let container: any =
      lastDotPosition === -1
        ? this.selectData
        : this.findIncludeObjectByPath(path.slice(0, lastDotPosition));

    if (container && !container?.include) container.include = [component];
    else if (container && Array.isArray(container.include))
      container.include.push(component);

    // Handle select attributes
    if (dataJoin.attributes)
      this.handleSelect(dataJoin.attributes, undefined, component);

    // Disable subQuery
    this.selectData.subQuery = false;

    // Add Component into Container
    this.rootContainer[path] = component;

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
      else if (conditionData.conditions) {
        conditions.push(
          this.parseConditions(
            conditionData.conditions.map((val) => ({
              ...val,
              columnName: `$${this.path2Alias(val.path)}.${val.columnName}$`,
            }))
          )
        );
      }
    }
    this.where = this.concatLogicalWhere(this.where, { [op]: conditions });
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
      distinct: true,
    }) as unknown as number;
    const findMany = (this.model as any).findAll(
      dataSelect
    ) as unknown as any[];

    const [total, items] = await Promise.all([countFunc, findMany]);

    return { total, items };
  }

  //
  //
  //  Function of Sequelize Adapter
  //
  //

  /**
   * Get alias name of `Componet` by `Container`.
   *
   * On Sequelize, alias name is set in association of Model. Example:
   * ```js
   * Student.belongsTo(Course, {as: "course"}).
   * ```
   * Alias name of Course on relationship between Student and Course is `course`.
   */
  getAlias(component: typeof Model): string;
  getAlias(componentPath: string): string;
  getAlias(containerPath: string, component: typeof Model): string;
  getAlias(
    containerTarget: typeof Model,
    componentTarget: typeof Model
  ): string;
  getAlias(containerTarget: typeof Model, componentPath: string): string;
  getAlias(containerPath: string, componentPath: string): string;

  getAlias(arg1: unknown, arg2?: unknown): string {
    let container: typeof Model, component: typeof Model;

    if (!arg2) container = this.targets[""] as typeof Model;
    else if (typeof arg1 === "string")
      container = this.targets[arg1] as typeof Model;
    else container = arg1 as typeof Model;

    if (!arg2) component = this.targets[arg1 as string] as typeof Model;
    else if (typeof arg2 === "string")
      component = this.targets[arg2] as typeof Model;
    else component = arg2 as typeof Model;

    for (const [as, model] of Object.entries(container.associations)) {
      if (model.target.tableName === component.tableName) return model.as;
    }
    throw new Error("Not found Component");
  }

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
  parseConditions(conditions: ConditionData[]) {
    return conditions.reduce((pre, e) => {
      /**
       * Set column name in where'clause of sequelize
       * If target path
       */
      const columnName = e.columnName;
      return {
        ...pre,
        [columnName]: this.genOperator(e.operator, e.params),
      };
    }, {});
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
  findIncludeObjectByPath(path: string) {
    // if (!Array.isArray(path)) path = path.split(".");
    // let currentAlias = "";
    // let current: IncludeOptions | null = this.selectData;
    // for (let i = 0; i < path.length; i++) {
    //   const joinName = path[i];
    //   currentAlias =
    //     currentAlias === "" ? joinName : `${currentAlias}.${joinName}`;
    //   let find;
    //   if (
    //     !current?.include ||
    //     (find = current.include.findIndex(
    //       (val: any) => val.as === currentAlias
    //     )) === -1
    //   ) {
    //     current = null;
    //     break;
    //   }
    //   current = current.include[find] as IncludeOptions;
    // }

    const current = this.rootContainer[path];
    if (!current)
      throw new Error("Not found include object with path: " + path);
    return current;
  }

  /**
   * Concat current where object with logical operator
   * @returns {object}
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

  private path2Alias(path?: string) {
    if (!path || path === "") return "";
    const paths = path.split(".");
    let containerPath = "";
    let newContainerPath = "";
    return paths.reduce((init, val) => {
      newContainerPath = containerPath === "" ? val : containerPath + "." + val;
      init =
        init === ""
          ? this.getAlias(containerPath, newContainerPath)
          : init + "." + this.getAlias(containerPath, newContainerPath);
      containerPath = newContainerPath;
      return init;
    }, "");
  }
}
