"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBuilderAdapterFactory = void 0;
const SequelizeFilterBuilderAdapter_1 = require("./SequelizeFilterBuilderAdapter");
const TypeormFilterBuilderAdapter_1 = require("./TypeormFilterBuilderAdapter");
class FilterBuilderAdapterFactory {
    static create(type = "typeorm", config, opts) {
        if (type === "typeorm")
            return new TypeormFilterBuilderAdapter_1.TypeormFilterBuilderAdapter(opts.core, opts.page, opts.limit, opts.aliasTableName);
        if (type === "sequelize")
            return new SequelizeFilterBuilderAdapter_1.SequelizeFilterBuilderAdapter(opts.core, opts.page, opts.limit, opts.aliasTableName);
        throw new Error(`Type ${type} is not supports!`);
    }
}
exports.FilterBuilderAdapterFactory = FilterBuilderAdapterFactory;
