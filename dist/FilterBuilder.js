"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBuilder = void 0;
const BaseCondition_1 = require("./BaseCondition");
class FilterBuilder extends BaseCondition_1.BaseCondition {
    /**
     * @param repo Repository contain Entity needs filters
     * @param queryData Query Object in request
     * @param alias table name
     */
    constructor(repo, queryData, alias) {
        const tableName = alias !== null && alias !== void 0 ? alias : repo.metadata.tableName;
        super(queryData, tableName);
        this.isFistWhereCondition = true;
        this.repo = repo;
        this.selectQueryBuilder = repo.createQueryBuilder(this.ownerName);
    }
    attribute(attributes) {
        this.selectQueryBuilder.select(attributes);
        return this;
    }
    // leftJoin(foreignKey:string, alias:string, condition?: ConditionBuilder):this {
    //     this.selectQueryBuilder.leftJoinAndSelect(foreignKey,alias);
    //     if(condition) {
    //         const subqueries = condition.getSubQuery();
    //         subqueries.forEach(subquery => {
    //             this.selectQueryBuilder[this.getWhereMethodName()](
    //                 subquery[0], subquery[1]
    //             )
    //         });
    //     }
    //     return this;
    // }
    // innerJoin(foreignKey:string, alias:string, condition?: ConditionBuilder):this {
    //     this.selectQueryBuilder.leftJoinAndSelect(foreignKey,alias);
    //     if(condition) {
    //         const subqueries = condition.getSubQuery();
    //         subqueries.forEach(subquery => {
    //             this.selectQueryBuilder[this.getWhereMethodName()](
    //                 subquery[0], subquery[1]
    //             )
    //         });
    //     }
    //     return this;
    // }
    order(queryFieldName, columnName, defaultValue) {
        let { value, columnName: column } = this.formatInputField(queryFieldName, columnName, defaultValue);
        const sortOptions = value.toUpperCase();
        if (sortOptions !== "ASC" && sortOptions !== "DESC")
            return this;
        const fieldName = this.genAccessFieldName(column);
        this.selectQueryBuilder.orderBy(fieldName, sortOptions);
        return this;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const skip = this.queryData.page * this.queryData.limit;
            const take = this.queryData.limit;
            const cloneSqlBuilder = this.selectQueryBuilder
                .clone()
                .skip(skip)
                .take(take);
            try {
                const [total, items] = yield Promise.all([
                    this.selectQueryBuilder.getCount(),
                    cloneSqlBuilder.getRawAndEntities(),
                ]);
                return {
                    currentPage: this.queryData.page,
                    limit: this.queryData.page,
                    total,
                    items: items.entities,
                };
            }
            catch (error) {
                console.error("Filter error!!", error);
                throw error;
            }
        });
    }
    getWhereMethodName() {
        const methodName = this.isFistWhereCondition
            ? "where"
            : "andWhere";
        this.isFistWhereCondition = false;
        return methodName;
    }
    processSql(sql, params) {
        const whereMethod = this.getWhereMethodName();
        this.selectQueryBuilder[whereMethod](sql, params);
    }
}
exports.FilterBuilder = FilterBuilder;
