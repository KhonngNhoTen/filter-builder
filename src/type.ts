
export type OperatorEnum = "LIKE" | "ILIKE" | ">" | "<" | ">=" | "<=" | "=" | "IN" | "BETWEEN"
export class BaseQueryData {
  readonly page: number = 1;
  readonly limit: number = 10;
}


export type ResultFilter = {
  total: number,
  limit: number,
  currentPage: number,
  items: []
}

export type SortOptions = "ASC" | "DESC";

export type QueryData = BaseQueryData & Record<string, any>;

export type BeforeEachConditionHook = (data: BeforeEachConditionDto) => BeforeEachConditionDto;
export type BeforeEachConditionDto = {
  keyword: string,
  params: object,
  sqlString: string
};

export type FilterBuilderConfigHooks = {
  beforeEachCondition?: BeforeEachConditionHook[],
  genColumnNameHook?: GenColumnNameHook
}

export type GenColumnNameHook = (data: GenColumnNameHookDto) => GenColumnNameHookDto;
export type GenColumnNameHookDto = {
  columnName?: string;
  tableName?: string;
};


export type DataInputFormatted = {
  value: any,
  columnName: string
}