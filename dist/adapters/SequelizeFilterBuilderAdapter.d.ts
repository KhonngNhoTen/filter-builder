import { FindManyOptions } from "typeorm";
import { OperatorEnum, SortOptions } from "../type";
import { FilterBuilderAdapter } from "./FilterBuilderAdapter";
export declare class SequelizeFilterBuilderAdapter<T> extends FilterBuilderAdapter<T> {
    protected readonly model: T;
    protected selectData: FindManyOptions;
    constructor(model: T, page: number, limit?: number, alias?: string);
    genOperator(operator: OperatorEnum, params: any): {
        [x: string]: any;
    };
    handleCondition(columnName: string, operator: OperatorEnum, params: any): void;
    handleOrder(columName: string, sortOpts: SortOptions): void;
    handleGroup(columnName: string): void;
    handleHaving(): void;
    handleRun(): Promise<{
        total: number;
        items: any[];
    }>;
}
