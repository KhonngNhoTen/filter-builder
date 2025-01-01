import { OperatorEnum, SortOptions } from "../type";
export declare abstract class FilterBuilderAdapter<T> {
    protected offset?: number;
    protected limit?: number;
    protected tableName: string;
    protected page: number;
    constructor(tableName: string, page: number, limit?: number, options?: any);
    /** Get table name */
    getTableName(): string;
    /**
     * Handle where clause with Orm
     * @param columnName ColumnName in database
     * @param operator operator in sql
     * @param params data of condition
     */
    abstract handleCondition(columnName: string, operator: OperatorEnum, params: any): void;
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
}
