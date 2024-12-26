export type OperatorEnum = "LIKE" | "ILIKE" | ">" | "<" | ">=" | "<=" | "=" | "IN" | "BETWEEN";
export declare class BaseQueryData {
    readonly page: number;
    readonly limit: number;
}
export type ResultFilter<T> = {
    total: number;
    limit: number;
    currentPage: number;
    items: T[];
};
export type SortOptions = "ASC" | "DESC";
export type QueryData = BaseQueryData & Record<string, any>;
export type BeforeEachConditionHook = (data: BeforeEachConditionDto) => BeforeEachConditionDto;
export type BeforeEachConditionDto = {
    keyword: string;
    params: object;
    sqlString: string;
};
export type FilterBuilderConfigHooks = {
    beforeEachCondition?: BeforeEachConditionHook[];
    genColumnNameHook?: GenColumnNameHook;
};
export type GenColumnNameHook = (data: GenColumnNameHookDto) => GenColumnNameHookDto;
export type GenColumnNameHookDto = {
    columnName?: string;
    tableName?: string;
};
export type DataInputFormatted = {
    value: any;
    columnName: string;
};
