import { FilterBuilderAdapterFactory } from "./adapters/FilterBuilderAdapterFactory";
import {
  AdapterType,
  BeforeEachConditionDto,
  BeforeOrderHookDto,
  FilterBuilderConfigHooks,
  FilterConfigOpts,
  GetColumnNameHookDto,
  JoinData,
  UpdateFilterConfigOpts,
} from "./type";

export class FilterBuilderConfig {
  private static globalConfig: FilterBuilderConfig;
  private hooks: FilterBuilderConfigHooks;
  readonly type: AdapterType;
  readonly dataSource?: any;
  readonly factoryAdapter: typeof FilterBuilderAdapterFactory;

  static getGlobalConfig() {
    if (!this.globalConfig) return new FilterBuilderConfig();
    return this.globalConfig;
  }

  static config(options: FilterConfigOpts) {
    this.globalConfig = new FilterBuilderConfig(options);
    return this.globalConfig;
  }

  constructor(opts?: FilterConfigOpts) {
    this.hooks = opts?.hooks ?? {};
    this.type = opts?.type ?? "typeorm";
    this.dataSource = opts?.dataSource;
    this.factoryAdapter = opts?.factoryAdapter ?? FilterBuilderAdapterFactory;
  }

  clone() {
    const { hooks, type, dataSource, factoryAdapter } = this;
    return new FilterBuilderConfig({
      hooks,
      type,
      dataSource,
      factoryAdapter,
    });
  }

  update(options: UpdateFilterConfigOpts) {
    if (options.hooks) this.hooks = options.hooks;
  }

  runBeforeEachConditionHook(data: BeforeEachConditionDto): BeforeEachConditionDto {
    if (this.hooks?.beforeEachCondition && Array.isArray(this.hooks?.beforeEachCondition)) {
      for (let i = 0; i < this.hooks.beforeEachCondition.length; i++) {
        const hook = this.hooks.beforeEachCondition[i];
        data = hook(data);
      }
    }
    return data;
  }

  runGetColumnNameHook(data: GetColumnNameHookDto) {
    if (this.hooks && this.hooks?.getColumnName) return this.hooks.getColumnName(data);
    return data;
  }

  runBeforeOrder(data: BeforeOrderHookDto) {
    if (this.hooks?.beforeOrder && Array.isArray(this.hooks.beforeOrder)) {
      const beforeOrderHooks = this.hooks.beforeOrder;
      for (let i = 0; i < beforeOrderHooks.length; i++) {
        const hook = beforeOrderHooks[i];
        data = hook(data);
      }
    }
    return data;
  }

  runBeforeGroup(columName: string) {
    if (this.hooks?.beforeGroup) columName = this.hooks?.beforeGroup(columName);
    return columName;
  }

  runBeforeJoin(joinData: JoinData) {
    if (this.hooks?.beforeJoinHook) joinData = this.hooks?.beforeJoinHook(joinData);
    return joinData;
  }
}
