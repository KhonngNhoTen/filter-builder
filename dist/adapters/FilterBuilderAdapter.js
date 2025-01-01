"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBuilderAdapter = void 0;
class FilterBuilderAdapter {
    constructor(tableName, page, limit, options) {
        this.tableName = tableName;
        this.page = page;
        if (limit) {
            this.offset = (page - 1) * limit + 1;
            this.limit = limit;
            this.page = page;
        }
    }
    /** Get table name */
    getTableName() {
        return this.tableName;
    }
}
exports.FilterBuilderAdapter = FilterBuilderAdapter;
