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
exports.SequelizeFilterBuilderAdapter = void 0;
const FilterBuilderAdapter_1 = require("./FilterBuilderAdapter");
class SequelizeFilterBuilderAdapter extends FilterBuilderAdapter_1.FilterBuilderAdapter {
    constructor(model, page, limit, alias) {
        const tableName = model.tableName;
        super(tableName, page, limit);
        this.selectData = { where: {} };
        this.model = model;
    }
    genOperator(operator, params) {
        const mapOperators = {
            "<": "lt",
            "<=": "lte",
            "=": "eq",
            ">": "gt",
            ">=": "gte",
            BETWEEN: "between",
            ILIKE: "iLike",
            LIKE: "like",
            IN: "in",
        };
        return { [mapOperators[operator]]: params };
    }
    handleCondition(columnName, operator, params) {
        this.selectData.where = {
            [columnName]: this.genOperator(operator, params),
        };
    }
    handleOrder(columName, sortOpts) {
        var _a;
        if (!((_a = this.selectData) === null || _a === void 0 ? void 0 : _a.order))
            this.selectData.order = {};
        this.selectData.order = Object.assign(Object.assign({}, this.selectData.order), { [columName]: sortOpts });
    }
    handleGroup(columnName) {
        throw new Error("Method not implemented.");
    }
    handleHaving() {
        throw new Error("Method not implemented.");
    }
    handleRun() {
        return __awaiter(this, void 0, void 0, function* () {
            const countFunc = this.model.count(this.selectData);
            const findMany = this.model.findAll(Object.assign(Object.assign({}, this.selectData), { limit: this.limit, offset: this.offset }));
            const [total, items] = yield Promise.all([countFunc, findMany]);
            return { total, items };
        });
    }
}
exports.SequelizeFilterBuilderAdapter = SequelizeFilterBuilderAdapter;
