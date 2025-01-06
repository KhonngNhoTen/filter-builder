import {
  DataInputFormatted,
  QueryData,
  OperatorEnum,
  UpdateFilterConfigOpts,
  GetColumnNameHookDto,
  LogicalOperator,
} from "./type";
import { FilterBuilderConfig } from "./FilterBuilderConfig";
import { checkUuid } from "./utils/check-uuid";
import { Condition } from "./Condition";
import { IFilter } from "./IFilter";

export abstract class BaseFilter implements IFilter {
  protected queryData: QueryData;
  protected config: FilterBuilderConfig;
  constructor(queryData: QueryData, config?: FilterBuilderConfig) {
    this.queryData = queryData;
    this.config = config ?? FilterBuilderConfig.getGlobalConfig();
  }

  /**
   * Manual config
   */
  setConfig(options: UpdateFilterConfigOpts) {
    this.config = this.config.clone();
    this.config.update(options);
    return this;
  }

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

  and(conditions: Condition[]): this {
    this.logicalCondition("AND", conditions);
    return this;
  }
  or(conditions: Condition[]): this {
    this.logicalCondition("OR", conditions);
    return this;
  }

  abstract logicalCondition(
    operator: LogicalOperator,
    conditions: Condition[]
  ): this;

  /**
   * Set list of attribute in select-clause
   * @param attributes list of column needs to select.
   * @returns
   */
  attributes(attributes: string[]): this {
    this.select(attributes);
    return this;
  }

  /**
   * Exclude column in select-clause
   * @param skips list of column needs to exclude in select-clause.
   * "*" is mean all columns
   * @returns
   */
  skipAttributes(skips: string[] | "*"): this {
    this.select(undefined, skips);
    return this;
  }

  /**
   * Set select-clause in query
   * @param attributes list of column needs to select.
   * @param skips list of column needs to excludes in select-clause.
   * "*" is mean all columns
   */
  protected abstract select(
    attributes?: string[],
    skips?: string[] | "*"
  ): void;

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

  /**
   * Get name of column after run hooks
   * @param columnName name of column
   * @returns
   */
  protected genAccessFieldName(columnName: string) {
    // Integrate Hooks
    let data: GetColumnNameHookDto = {
      columnName,
    };
    data = this.config.runGetColumnNameHook(data);

    // return `"${data.tableName}".${data.columnName}`;
    return `${data.columnName}`;
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
    this.saveCondition(columnName, operator, value);
  }

  /**
   * Main function process all ternary operation */
  protected ternaryOperation(
    columnName: string,
    operator: OperatorEnum,
    values: Array<any>
  ) {
    if (!values || !Array.isArray(values) || values.length < 2) return;

    this.saveCondition(columnName, operator, values);
  }

  protected saveCondition(
    columnName: string,
    operator: OperatorEnum,
    params: any
  ) {
    // Run Hooks: Before Each Condition
    const data = this.config.runBeforeEachConditionHook({
      operator,
      columnName,
      params,
    });

    // End Hooks: Before Each Condition

    data.columnName = this.genAccessFieldName(data.columnName);

    this.processCondition(data.columnName, data.operator, data.params);
  }

  /** Define handle condition function */
  protected abstract processCondition(
    columnName: string,
    operator: OperatorEnum,
    params: any
  ): void;
}
