import { BaseCondition } from "./BaseCondition";
import { QueryData } from "./type";
export declare class ConditionBuilder extends BaseCondition {
    private dataSubquery;
    /**
     * @param owner Table Name
     * @param queryData Query object
     */
    constructor(owner: string, queryData: QueryData);
    protected processSql(sql: string, params: object): void;
    getSubQuery(): [string, object];
}
