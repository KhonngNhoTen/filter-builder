import { BaseCondition } from "./BaseCondition";
import { QueryData } from "./type";


export class ConditionBuilder extends BaseCondition {
  
    private dataSubquery: [string, object] = [] as any;
    /**
     * @param owner Table Name
     * @param queryData Query object
     */
    constructor(owner: string, queryData: QueryData) {
        super(queryData, owner);
    }

    protected processSql(sql: string, params: object): void {
        this.dataSubquery.push(sql, params);
    }
    getSubQuery() {
        return this.dataSubquery;
    }


}


