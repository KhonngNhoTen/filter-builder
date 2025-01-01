import {
  DataInputFormatted,
  QueryData,
  OperatorEnum,
  FilterConfigOpts,
  UpdateFilterConfigOpts,
} from "./type";
import { FilterBuilderConfig } from "./FilterBuilderConfig";
import { checkUuid } from "./utils/check-uuid";

export abstract class BaseCondition {
  protected queryData: QueryData;
  protected ownerName?: string = "";
  protected config: FilterBuilderConfig;
  constructor(queryData: QueryData, ownerName?: string) {
    this.queryData = queryData;
    this.ownerName = ownerName;
    this.config = FilterBuilderConfig.getGlobalConfig();
  }

  /**
   * Manual config
   */
  setConfig(options: UpdateFilterConfigOpts) {
    this.config = this.config.clone();
    this.config.update(options);
    return this;
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
  like(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    const data = this.formatInputField(
      queryFieldName,
      columnName,
      defaultValue
    );
    this.binaryOperator("LIKE", data.columnName, data.value);
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
  iLike(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    const data = this.formatInputField(
      queryFieldName,
      columnName,
      defaultValue
    );
    this.binaryOperator("ILIKE", data.columnName, data.value);
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
  equal(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    const data = this.formatInputField(
      queryFieldName,
      columnName,
      defaultValue
    );
    this.binaryOperator("=", data.columnName, data.value);
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
  less(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    const data = this.formatInputField(
      queryFieldName,
      columnName,
      defaultValue
    );
    this.binaryOperator("<", data.columnName, data.value);
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
  greater(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    const data = this.formatInputField(
      queryFieldName,
      columnName,
      defaultValue
    );
    this.binaryOperator(">", data.columnName, data.value);
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
  lte(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    const data = this.formatInputField(
      queryFieldName,
      columnName,
      defaultValue
    );
    this.binaryOperator("<=", data.columnName, data.value);
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
  gte(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    const data = this.formatInputField(
      queryFieldName,
      columnName,
      defaultValue
    );
    this.binaryOperator(">=", data.columnName, data.value);
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
  in(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: Array<any>
  ): this {
    const data = this.formatInputField(
      queryFieldName,
      columnName,
      defaultValue
    );
    this.binaryOperator("IN", data.columnName, data.value);
    return this;
  }

  /**
   * Condition with uuid.
   * If value isn't uuid, then it's ignored.
   * If value is array of uuid. Where-clause use "IN" operator.
   * If value is single of uuid. Where-clause use "=" operator.
   */
  uuid(
    queryFieldName: string,
    columnName?: string,
    defaultValue?: string
  ): this {
    const { value, columnName: column } = this.formatInputField(
      queryFieldName,
      columnName,
      defaultValue
    );
    if (value && !Array.isArray(value) && checkUuid(value))
      this.binaryOperator("=", column, value);
    else if (value && Array.isArray(value)) {
      const checker = value.reduce(
        (pre: boolean, crrValue: string) => pre && checkUuid(crrValue),
        true
      );
      if (checker) this.binaryOperator("IN", column, value);
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
  range(
    rangeFieldName: string[],
    columnName: string,
    defaultValue?: Array<any>
  ): this {
    defaultValue = defaultValue ?? [];
    let { value: value1, columnName: columName1 } = this.formatInputField(
      rangeFieldName[0],
      columnName,
      defaultValue[0]
    );
    let { value: value2 } = this.formatInputField(
      rangeFieldName[1],
      columnName,
      defaultValue[1]
    );

    this.ternaryOperation(columName1, "BETWEEN", [value1, value2]);
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
  makeRange(
    queryFieldName: string,
    makeArray: (arg: string) => Array<any>,
    columnName?: string
  ): this {
    columnName = columnName ?? queryFieldName;
    const stringArray = this.queryData[queryFieldName];
    if (stringArray) {
      const [begining, ending] = makeArray(stringArray);
      if (ending && !!!begining) this.binaryOperator(ending, "<=", columnName);
      else if (!!!ending && begining)
        this.binaryOperator(ending, ">=", columnName);
      else if (ending && begining)
        this.ternaryOperation(columnName, "BETWEEN", [begining, ending]);
    }
    return this;
  }

  /**
   * Format value to filter.
   * If columnName is null, then using queryFieldName.
   * If query[data] is null, then using defaultValue.
   */
  protected formatInputField(
    queryFieldName: string,
    column?: string,
    defaultValue?: any
  ): DataInputFormatted {
    let value = this.queryData[queryFieldName] ?? defaultValue;
    let columnName = column ?? queryFieldName;
    if (typeof value === "string") value = value.trim();
    return { value, columnName };
  }

  protected genAccessFieldName(columnName: string) {
    // Integrate Hooks
    const data = this.config.runGetColumnNameHook({
      columnName,
      tableName: this.ownerName,
    });

    return `"${data.tableName}".${data.columnName}`;
  }

  /**
   * Main function process all binary operator
   * @param operator
   * @param columnName array of column's name in database
   * @param value array of value for filter
   */
  protected binaryOperator(
    operator: OperatorEnum,
    columnName: string,
    value: any
  ) {
    if (!value) return;
    const accessColumn = this.genAccessFieldName(columnName);
    this.saveCondition(accessColumn, operator, value);
  }

  /**
   * Main function process all ternary operation */
  protected ternaryOperation(
    columnName: string,
    operator: OperatorEnum,
    values: Array<any>
  ) {
    if (!values || !Array.isArray(values) || values.length < 2) return;

    const accessColumn = this.genAccessFieldName(columnName);
    this.saveCondition(accessColumn, operator, values);
  }

  protected saveCondition(
    columName: string,
    operator: OperatorEnum,
    params: any
  ) {
    // Run Hooks: Before Each Condition
    const data = this.config.runBeforeEachConditionHook({
      operator,
      columName,
      params,
    });

    // End Hooks: Before Each Condition

    data.columName = this.genAccessFieldName(data.columName);

    this.processCondition(data.columName, data.operator, data.params);
  }

  /** Define handle condition function */
  protected abstract processCondition(
    columName: string,
    operator: OperatorEnum,
    params: any
  ): void;
}
