import { DataInputFormatted, QueryData, OperatorEnum } from "./type";
export declare abstract class BaseCondition {
    protected queryData: QueryData;
    protected ownerName: string;
    constructor(queryData: QueryData, ownerName: string);
    /**
     * Add Like condition to where-clause of query string. Use "LIKE" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    like(queryFieldName: string, columnName?: string, defaultValue?: string): this;
    /**
     * Add iLike condition to where-clause of query string. Use "ILIKE" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    iLike(queryFieldName: string, columnName?: string, defaultValue?: string): this;
    /**
     * Add iLike condition to where-clause of query string. Use "=" operator.
     *  If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    equal(queryFieldName: string, columnName?: string, defaultValue?: string): this;
    /**
     * Add less <value>-condition to where-clause of query string. Use "<" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    less(queryFieldName: string, columnName?: string, defaultValue?: string): this;
    /**
     * Add greater <value>-condition to where-clause of query string. Use ">" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    greater(queryFieldName: string, columnName?: string, defaultValue?: string): this;
    /**
     * Add less or equal <value>-condition to where-clause of query string. Use "<=" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    lte(queryFieldName: string, columnName?: string, defaultValue?: string): this;
    /**
     * Add greater or equal <value>-condition to where-clause of query string. Use ">=" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    gte(queryFieldName: string, columnName?: string, defaultValue?: string): this;
    /**
     * If Column value belongs to array of items, then clause is true.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    in(queryFieldName: string, columnName?: string, defaultValue?: Array<any>): this;
    /**
     * Condition with uuid.
     * If value isn't uuid, then it's ignored.
     * If value is array of uuid. Where-clause use "IN" operator.
     * If value is single of uuid. Where-clause use "=" operator.
     */
    uuid(queryFieldName: string, columnName?: string, defaultValue?: string): this;
    /**
     * This condition filter a field from the beginning value to the ending value.
     * The function takes an args as a two-element array,
     * which contains the names of the beginning and ending data fields.
     * If begining value is empty, condition uses "<=" operator.
     * If ending value is empty, condition uses ">=" operator.
     * If ending and begining is not empty, condition uses "BETWEEN" operator.
     * @param rangeFieldName Array of fields names in query: [BeginingName, EndingName].
     * Includes begining name and ending name
     * @param columnName Column's name need filter
     * @param defaultValue Array of default value: [BeginingValue, EndingValue].
     * Includes begining value and ending value
     * @returns
     */
    range(rangeFieldName: string[], columnName: string, defaultValue?: Array<any>): this;
    /**
     * This condition helps convert a string into an array of values,
     * including the beginning and ending values.
     * Finally, it filters the column based on the values of
     * that beginning and ending array.
     * If begining value is empty, condition uses "<=" operator.
     * If ending value is empty, condition uses ">=" operator.
     * If ending and begining is not empty, condition uses "BETWEEN" operator.
     * @param columnName Column's name need filter
     * @param makeArray Function convert string to array value
     * @returns
     */
    makeRange(columnName: string, makeArray: (arg: string) => Array<any>): this;
    /**
     * Format value to filter.
     * If columnName is null, then using queryFieldName.
     * If query[data] is null, then using defaultValue.
     */
    protected formatInputField(queryFieldName: string, column?: string, defaultValue?: any): DataInputFormatted;
    /**
     * Gen right clause of where clause. It depends on the operator;
     * the structure of the right-hand side will vary
     */
    protected genRightClauseCondition(operator: OperatorEnum, aliasColumnName: string, aliasColumnName2?: string): string;
    /** Convert columnName for where-clause params */
    protected genAliasColumnName(columName: string): string;
    protected genAccessFieldName(columnName: string): string;
    /**
     * Main function process all unary operator
     * @param operator
     * @param columnName array of column's name in database
     * @param value array of value for filter
     */
    protected unaryOperator(operator: OperatorEnum, columnName: string, value: any): void;
    /**
     * Main function process all binary operator */
    protected binaryOperator(columnName: string, operator: OperatorEnum, values: Array<any>): void;
    protected saveCondition(keyword: string, params: object, sqlString: string): void;
    /** Define use sql-string */
    protected abstract processSql(sql: string, params: object): void;
}
