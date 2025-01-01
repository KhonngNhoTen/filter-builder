import { DataSource, SelectQueryBuilder } from "typeorm";
import { OperatorEnum, SortOptions } from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
type TypeormFilterBuilderAdapterOptions = {
    dataSource?: DataSource;
};
export declare class TypeormFilterBuilderAdapter<T extends object> extends FilterBuilderAdapter<T> {
    protected isFistWhereCondition: boolean;
    protected selectQueryBuilder: SelectQueryBuilder<T>;
    constructor(entity: T, page: number, limit?: number, alias?: string, options?: TypeormFilterBuilderAdapterOptions);
    handleCondition(columnName: string, operator: OperatorEnum, params: object): void;
    handleOrder(columName: string, sortOpts: SortOptions): void;
    handleGroup(columnName: string): void;
    handleHaving(): void;
    private getWhereMethodName;
    /**
     * Gen right clause of where clause. It depends on the operator;
     * the structure of the right-hand side will vary
     */
    protected genRightClauseCondition(operator: OperatorEnum, param: string, param2?: string): string;
    /** Convert columnName for where-clause params */
    protected genUniqueParamsName(columnName: string, params: any): {
        [x: string]: any;
    };
    handleRun(): Promise<{
        total: number;
        items: T[];
    }>;
}
export {};
