import { SubFilter } from "../SubFilter";
import {
  ConditionData,
  LogicalOperator,
  OperatorEnum,
  SortOptions,
} from "../type";

export abstract class FilterBuilderAdapter<T> {
  protected offset?: number;
  protected limit: number | "*" = 10;
  protected ownerName: string;
  protected page: number = 1;

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
   * Get table name
   */
  getOwnerName(): string {
    return this.ownerName;
  }

  /**
   * Gen alias for select table
   */
  genAlias(path: string) {
    return path;
  }

  /**
   * Handle where clause with Orm
   * @param columnName ColumnName in database
   * @param operator operator in sql
   * @param params data of condition
   */
  abstract handleCondition(
    columnName: string,
    operator: OperatorEnum,
    params: any
  ): void;

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

  abstract handleRun(): Promise<{
    total: number;
    items: T[];
  }>;

  abstract handleJoin(dataJoin: ConditionData, required: boolean): void;

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
  abstract handleLogicalOperator<U>(
    operator: LogicalOperator,
    subFilters: SubFilter<U>[]
  ): void;
}
