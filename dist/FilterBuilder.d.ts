import { ObjectLiteral, Repository } from "typeorm";
import { BaseCondition } from "./BaseCondition";
import { QueryData, ResultFilter } from "./type";
export declare class FilterBuilder<T extends ObjectLiteral> extends BaseCondition {
    private repo;
    private selectQueryBuilder;
    private isFistWhereCondition;
    /**
     * @param repo Repository contain Entity needs filters
     * @param queryData Query Object in request
     * @param alias table name
     */
    constructor(repo: Repository<T>, queryData: QueryData, alias?: string);
    attribute(attributes: string[]): this;
    order(queryFieldName: string, columnName?: string, defaultValue?: string): this;
    run(): Promise<ResultFilter<T>>;
    private getWhereMethodName;
    protected processSql(sql: string, params: object): void;
}
