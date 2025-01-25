import { SubFilter } from "../SubFilter";
import { ConditionData, JoinData, LogicalOperator, OperatorEnum, SortOptions } from "../type";

export abstract class FilterBuilderAdapter<Target> {
  protected offset?: number;
  protected limit: number | "*" = 10;
  protected ownerName: string;
  protected page: number = 1;

  /**
   * The hash-map contais all Target in FilterBuilder.
   *
   * The Target is ORM-class. It represents to a table in database.
   * EX: With Sequelize, Target is a class extends Model. With Typeorm,
   * Target is a Entity.
   *
   * Each Target is linked by path. Path has value is "", links to Main Target in FilterBuilder.
   *
   * On relationship of between two targets. Target wraps other, is called Target-Container or Container.
   * Otherhands, it is called Target-Component or Component.
   * Main Target - is highest target, is called Root.
   *
   */
  protected targets: Record<string, Target> = {};

  constructor(tableName: string, page: number, limit?: number, options?: any) {
    this.ownerName = tableName;
    this.page = page;
    if (limit) {
      this.offset = page ? (page - 1) * limit : 0;
      this.limit = limit ?? 10;
      this.page = page ?? 1;
    }
  }

  /**
   * Get target by path. If path = "", returns Main Target
   * @param path
   * @returns
   */
  getTargetByPath(path: string = "") {
    const target = this.targets[path];
    if (!target) throw new Error(`Path ${path} not exists`);
    return target;
  }

  /**
   * Get table name
   */
  getOwnerName(): string {
    return this.ownerName;
  }

  /**
   * Handle where clause with Orm
   * @param condition.columnName ColumnName in database
   * @param condition.operator operator in sql
   * @param condition.params data of condition
   */
  abstract handleCondition(conditionData: ConditionData): void;

  /**
   * Handle order clause with Orm
   * @param columnName ColumnName in database
   * @param sortOpts sort option. "DESC" or "ASC"
   */
  abstract handleOrder(columName: string, sortOpts: SortOptions): void;

  /**
   * Handle group clause with Orm
   * @param columnName ColumnName in database
   */
  abstract handleGroup(columnName: string): void;

  abstract handleHaving(): void;

  /**
   * Return list of row on databases
   */
  abstract handleRun(): Promise<{
    total: number;
    items: Target[];
  }>;

  /**
   * Join on Target bases dataJoin and type of ORM.
   *
   * Finally, add Target into Map Taget
   *
   * NOTE: On relationship of between two targets. Target wraps other, is called Target-Container or Container.
   * Otherhands, it is called Target-Component or Component.
   * Main Target - is highest target, is called Root.
   *
   * Example, in bellow relationship:
   * ```js
   * Student.join(Course)
   * ```
   * `Student` is a `Container`. `Course` is a `Component`
   * @param dataJoin
   */
  handleJoin(dataJoin: JoinData): void {
    if (this.targets[dataJoin.path]) throw new Error(`Path [${dataJoin.path}] is duplicated!!`);
    this.targets[dataJoin.path] = dataJoin.target;
  }

  /**
   * Get column in current table
   * @param target class ORM represents table
   */
  abstract getColumns(target?: any): Record<string, any>;

  /**
   * Handle select columns in current table
   * @param attribute list of attribute need to select.
   * @param path path for linked table
   */
  abstract handleSelect(attribute: string[], path?: string): void;

  /**
   * handle "and", "or" query.
   * @param operator
   * @param subFilters
   */
  abstract handleLogicalOperator<U>(operator: LogicalOperator, subFilters: SubFilter<U>[]): void;
}
