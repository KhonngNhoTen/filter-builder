"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionBuilder = void 0;
const BaseCondition_1 = require("./BaseCondition");
class ConditionBuilder extends BaseCondition_1.BaseCondition {
    /**
     * @param owner Table Name
     * @param queryData Query object
     */
    constructor(owner, queryData) {
        super(queryData, owner);
        this.dataSubquery = [];
    }
    processSql(sql, params) {
        this.dataSubquery.push(sql, params);
    }
    getSubQuery() {
        return this.dataSubquery;
    }
}
exports.ConditionBuilder = ConditionBuilder;
