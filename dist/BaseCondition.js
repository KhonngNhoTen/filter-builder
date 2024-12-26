"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCondition = void 0;
const FilterBuilderConfig_1 = require("./FilterBuilderConfig");
const check_uuid_1 = require("./utils/check-uuid");
class BaseCondition {
    constructor(queryData, ownerName) {
        this.ownerName = "";
        this.queryData = queryData;
        this.ownerName = ownerName;
    }
    /**
     * Add Like condition to where-clause of query string. Use "LIKE" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    like(queryFieldName, columnName, defaultValue) {
        const data = this.formatInputField(queryFieldName, columnName, defaultValue);
        this.unaryOperator("LIKE", data.columnName, data.value);
        return this;
    }
    /**
     * Add iLike condition to where-clause of query string. Use "ILIKE" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    iLike(queryFieldName, columnName, defaultValue) {
        const data = this.formatInputField(queryFieldName, columnName, defaultValue);
        this.unaryOperator("ILIKE", data.columnName, data.value);
        return this;
    }
    /**
     * Add iLike condition to where-clause of query string. Use "=" operator.
     *  If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    equal(queryFieldName, columnName, defaultValue) {
        const data = this.formatInputField(queryFieldName, columnName, defaultValue);
        this.unaryOperator("=", data.columnName, data.value);
        return this;
    }
    /**
     * Add less <value>-condition to where-clause of query string. Use "<" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    less(queryFieldName, columnName, defaultValue) {
        const data = this.formatInputField(queryFieldName, columnName, defaultValue);
        this.unaryOperator("<", data.columnName, data.value);
        return this;
    }
    /**
     * Add greater <value>-condition to where-clause of query string. Use ">" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    greater(queryFieldName, columnName, defaultValue) {
        const data = this.formatInputField(queryFieldName, columnName, defaultValue);
        this.unaryOperator(">", data.columnName, data.value);
        return this;
    }
    /**
     * Add less or equal <value>-condition to where-clause of query string. Use "<=" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    lte(queryFieldName, columnName, defaultValue) {
        const data = this.formatInputField(queryFieldName, columnName, defaultValue);
        this.unaryOperator("<=", data.columnName, data.value);
        return this;
    }
    /**
     * Add greater or equal <value>-condition to where-clause of query string. Use ">=" operator.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    gte(queryFieldName, columnName, defaultValue) {
        const data = this.formatInputField(queryFieldName, columnName, defaultValue);
        this.unaryOperator(">=", data.columnName, data.value);
        return this;
    }
    /**
     * If Column value belongs to array of items, then clause is true.
     * If value is undefine (not exists in query) and defaultValue is not set,
     * this condition is ignored
     * @param queryFieldName Field's name of query object.
     * @param defaultValue default value if it not exists in queryData.
     * @param columnName column's name of table
     * @returns
     */
    in(queryFieldName, columnName, defaultValue) {
        const data = this.formatInputField(queryFieldName, columnName, defaultValue);
        this.unaryOperator("IN", data.columnName, data.value);
        return this;
    }
    /**
     * Condition with uuid.
     * If value isn't uuid, then it's ignored.
     * If value is array of uuid. Where-clause use "IN" operator.
     * If value is single of uuid. Where-clause use "=" operator.
     */
    uuid(queryFieldName, columnName, defaultValue) {
        const { value, columnName: column } = this.formatInputField(queryFieldName, columnName, defaultValue);
        if (value && !Array.isArray(value) && (0, check_uuid_1.checkUuid)(value))
            this.unaryOperator("=", column, value);
        else if (value && Array.isArray(value)) {
            const checker = value.reduce((pre, crrValue) => pre && (0, check_uuid_1.checkUuid)(crrValue), true);
            if (checker)
                this.unaryOperator("IN", column, value);
        }
        return this;
    }
    /**
     * This condition filter a field from the beginning value to the ending value.
     * The function takes an args as a two-element array,
     * which contains the names of the beginning and ending data fields.
     * If begining value is empty, condition uses "<=" operator.
     * If ending value is empty, condition uses ">=" operator.
     * If ending and begining is not empty, condition uses "BETWEEN" operator.
     * @param rangeFieldName Array of fields names in query: [BeginingName, EndingName].
     * Includes begining name and ending name
     * @param columnName Column's name need filter
     * @param defaultValue Array of default value: [BeginingValue, EndingValue].
     * Includes begining value and ending value
     * @returns
     */
    range(rangeFieldName, columnName, defaultValue) {
        defaultValue = defaultValue !== null && defaultValue !== void 0 ? defaultValue : [];
        let { value: value1, columnName: columName1 } = this.formatInputField(rangeFieldName[0], columnName, defaultValue[0]);
        let { value: value2, columnName: columName2 } = this.formatInputField(rangeFieldName[1], columnName, defaultValue[1]);
        this.binaryOperator(columName1, "BETWEEN", [value1, value2]);
        return this;
    }
    /**
     * This condition helps convert a string into an array of values,
     * including the beginning and ending values.
     * Finally, it filters the column based on the values of
     * that beginning and ending array.
     * If begining value is empty, condition uses "<=" operator.
     * If ending value is empty, condition uses ">=" operator.
     * If ending and begining is not empty, condition uses "BETWEEN" operator.
     * @param columnName Column's name need filter
     * @param makeArray Function convert string to array value
     * @returns
     */
    makeRange(columnName, makeArray) {
        const stringArray = this.queryData[columnName];
        if (stringArray) {
            const [begining, ending] = makeArray(stringArray);
            if (ending && !!!begining)
                this.unaryOperator(ending, "<=", columnName);
            else if (!!!ending && begining)
                this.unaryOperator(ending, ">=", columnName);
            else if (ending && begining)
                this.binaryOperator(columnName, "BETWEEN", [begining, ending]);
        }
        return this;
    }
    /**
     * Format value to filter.
     * If columnName is null, then using queryFieldName.
     * If query[data] is null, then using defaultValue.
     */
    formatInputField(queryFieldName, column, defaultValue) {
        var _a;
        let value = (_a = this.queryData[queryFieldName]) !== null && _a !== void 0 ? _a : defaultValue;
        let columnName = column !== null && column !== void 0 ? column : queryFieldName;
        if (typeof value === "string")
            value = value.trim();
        return { value, columnName };
    }
    /**
     * Gen right clause of where clause. It depends on the operator;
     * the structure of the right-hand side will vary
     */
    genRightClauseCondition(operator, aliasColumnName, aliasColumnName2) {
        if (operator === "ILIKE" || operator === "LIKE")
            return `${operator} %:${aliasColumnName}%`;
        if (operator === "IN")
            return `IN (...:${aliasColumnName})`;
        if (operator === "BETWEEN") {
            return `BETWEEN :${aliasColumnName} AND :${aliasColumnName2}`;
        }
        return `${operator} :${aliasColumnName}`;
    }
    /** Convert columnName for where-clause params */
    genAliasColumnName(columName) {
        return this.ownerName + "_" + columName;
    }
    genAccessFieldName(columnName) {
        // Integrate Hooks
        const data = FilterBuilderConfig_1.FilterBuilderConfig.getInstance().runGenColumnNameHook({
            columnName,
            tableName: this.ownerName,
        });
        return `"${data.tableName}".${data.columnName}`;
    }
    /**
     * Main function process all unary operator
     * @param operator
     * @param columnName array of column's name in database
     * @param value array of value for filter
     */
    unaryOperator(operator, columnName, value) {
        if (!value)
            return;
        const aliasColumnName = this.genAliasColumnName(columnName);
        const accessColumn = this.genAccessFieldName(columnName);
        this.saveCondition(operator, { [aliasColumnName]: value }, `${accessColumn} ${this.genRightClauseCondition(operator, aliasColumnName)}`);
    }
    /**
     * Main function process all binary operator */
    binaryOperator(columnName, operator, values) {
        if (values && values.length >= 2)
            return;
        const aliasParamsName = [
            this.genAliasColumnName(columnName + "_1"),
            this.genAliasColumnName(columnName + "_2"),
        ];
        const accessColumn = this.genAccessFieldName(columnName);
        this.genRightClauseCondition(operator, aliasParamsName[0], aliasParamsName[1]);
        this.saveCondition(operator, { [aliasParamsName[0]]: values[0], [aliasParamsName[1]]: values[1] }, `${accessColumn} ${this.genRightClauseCondition(operator, aliasParamsName[0], aliasParamsName[1])}`);
    }
    saveCondition(keyword, params, sqlString) {
        // Integrate Hooks
        const data = FilterBuilderConfig_1.FilterBuilderConfig.getInstance().runBeforeEachConditionHook({
            keyword,
            params,
            sqlString,
        });
        this.processSql(data.sqlString, data.params);
    }
}
exports.BaseCondition = BaseCondition;
FilterBuilderConfig_1.FilterBuilderConfig.getInstance().addHooks({
    genColumnNameHook: (data) => {
        // Convert camelCase to snake_case
        if (data === null || data === void 0 ? void 0 : data.columnName)
            data.columnName = data.columnName.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        return data;
    },
});
