import { FilterBuilderAdapterFactory } from "./adapters/FilterBuilderAdapterFactory";

export type OperatorEnum =
  | "LIKE"
  | "ILIKE"
  | ">"
  | "<"
  | ">="
  | "<="
  | "="
  | "IN"
  | "BETWEEN";
export class BaseQueryData {
  readonly page: number = 1;
  readonly limit: number = 10;
}

export type ResultFilter<T> = {
  total: number;
  limit: number | null;
  currentPage: number;
  items: T[];
};

export type SortOptions = "ASC" | "DESC";

export type AdapterType = "typeorm" | "sequelize";

export type QueryData = BaseQueryData & Record<string, any>;

export type DataInputFormatted = {
  value: any;
  columnName: string;
};

export type BeforeEachConditionHook = (
  data: BeforeEachConditionDto
) => BeforeEachConditionDto;
export type BeforeEachConditionDto = {
  params: any;
  operator: OperatorEnum;
  columName: string;
};

export type GetColumnNameHook = (
  data: GetColumnNameHookDto
) => GetColumnNameHookDto;
export type GetColumnNameHookDto = {
  columnName?: string;
  tableName?: string;
};

export type BeforeOrderHookDto = {
  columnName: string;
  sortOption: SortOptions;
};
export type BeforeOrderHook = (data: BeforeOrderHookDto) => BeforeOrderHookDto;

export type BeforeGroupHook = (columnName: string) => string;

export type BeforeJoinHook = (joinData: ConditionData) => ConditionData;

export type FilterBuilderConfigHooks = {
  beforeEachCondition?: BeforeEachConditionHook[];
  beforeOrder?: BeforeOrderHook[];
  beforeGroup?: BeforeGroupHook;
  beforeJoinHook?: BeforeJoinHook;
  getColumnName?: GetColumnNameHook;
};

export type FilterConfigOpts = {
  hooks: FilterBuilderConfigHooks;
  type: AdapterType;
  dataSource?: any;
  factoryAdapter?: typeof FilterBuilderAdapterFactory;
};

export type UpdateFilterConfigOpts = Omit<
  FilterConfigOpts,
  "dataSource" | "type" | "factoryAdapter"
>;

export type ResultFilterTransformFuncs = (items: any) => Promise<any> | any;

export type InstanceTypeOf<T> = T extends new (...args: any[]) => infer R
  ? R
  : never;

export type ConditionData = {
  target: string;
  prop: any;
  select: {
    columnName: string;
    operator: OperatorEnum;
    params: any;
  }[];
};
