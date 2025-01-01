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
exports.TypeormFilterBuilderAdapter = void 0;
const FilterBuilderAdapter_1 = require("./FilterBuilderAdapter");
class TypeormFilterBuilderAdapter extends FilterBuilderAdapter_1.FilterBuilderAdapter {
    constructor(entity, page, limit, alias, options) {
        if (!(options === null || options === void 0 ? void 0 : options.dataSource))
            throw new Error("You must set dataSource when using TypeOrmAdapter");
        const repo = options.dataSource.getRepository(entity);
        const tableName = repo.metadata.tableName;
        super(tableName, page, limit);
        this.isFistWhereCondition = true;
        this.selectQueryBuilder = repo.createQueryBuilder(this.getTableName());
    }
    handleCondition(columnName, operator, params) {
        params = this.genUniqueParamsName(columnName, params);
        const fieldNames = Object.keys(params);
        const rightClauseCondition = this.genRightClauseCondition(operator, fieldNames[0], fieldNames[1]);
        const whereMethod = this.getWhereMethodName();
        this.selectQueryBuilder[whereMethod](`${columnName} ${rightClauseCondition}`, { params });
    }
    handleOrder(columName, sortOpts) {
        this.selectQueryBuilder.orderBy(columName, sortOpts);
    }
    handleGroup(columnName) {
        this.selectQueryBuilder.groupBy(columnName);
    }
    handleHaving() {
        throw new Error("Method not implemented.");
    }
    getWhereMethodName() {
        const methodName = this.isFistWhereCondition
            ? "where"
            : "andWhere";
        this.isFistWhereCondition = false;
        return methodName;
    }
    /**
     * Gen right clause of where clause. It depends on the operator;
     * the structure of the right-hand side will vary
     */
    genRightClauseCondition(operator, param, param2) {
        if (operator === "ILIKE" || operator === "LIKE")
            return `${operator} %:${param}%`;
        if (operator === "IN")
            return `IN (...:${param})`;
        if (operator === "BETWEEN") {
            return `BETWEEN :${param} AND :${param2}`;
        }
        return `${operator} :${param}`;
    }
    /** Convert columnName for where-clause params */
    genUniqueParamsName(columnName, params) {
        const uniqueName = (columnName) => columnName + "_" + Date.now();
        const newParams = Array.isArray(params)
            ? {
                [uniqueName(`${columnName}_1`)]: params[0],
                [uniqueName(`${columnName}_2`)]: params[1],
            }
            : { [uniqueName(columnName)]: params };
        return newParams;
    }
    handleRun() {
        return __awaiter(this, void 0, void 0, function* () {
            const cloneSqlBuilder = this.selectQueryBuilder.clone();
            if (this.offset && this.limit)
                cloneSqlBuilder.skip(this.offset).take(this.limit);
            const [total, items] = yield Promise.all([
                this.selectQueryBuilder.getCount(),
                cloneSqlBuilder.getMany(),
            ]);
            return {
                total,
                items,
            };
        });
    }
}
exports.TypeormFilterBuilderAdapter = TypeormFilterBuilderAdapter;
